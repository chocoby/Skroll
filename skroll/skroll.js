/**
 * Skroll
 *
 * @version      0.41
 * @author       nori (norimania@gmail.com)
 * @copyright    5509 (http://5509.me/)
 * @license      The MIT License
 * @link         https://github.com/5509/skroll
 *
 * 2011-06-29 15:49
 */
/*
 * MEMO:
 * 基本縦のスクロールとして使う
 * 横スクロールはオプションで明示的に狭い幅を与えた場合に有効
 *
 * TODO:
 * IEの対応（主に7以下
 * mobile慣性スクロールの対応どうするのか
 * Androidのtouchmove対応が微妙っぽい
 * overflow: scrollが使えるらしいiOS5の対応をどうするのか
 */
;(function($, window, document, undefined) {

	// Global
	var MOBILE = "ontouchstart" in window,
		MOUSEWHEEL = "onmousewheel" in window ? "mousewheel" : "DOMMouseScroll",
		MATRIX = "matrix(1, 0, 0, 1, 0, 0)",
		$document = $(document),
		$html = $("html");

	// Bridge
	$.fn.skroll = function(option) {
		option = $.extend({
			sync            : false,
			margin          : 0,
			width           : parseInt(this.css("width"), 10),
			height          : parseInt(this.css("height"), 10),
			inSpeed         : 50,
			outSpeed        : 450,
			delayTime       : 200,
			scrollBarBorder : 1,
			scrollBarWidth  : 8,
			scrollBarHeight : 8,
			scrollBarSpace  : 0,
			scrollBarColor  : "#000",
			opacity         : .5,
			cursor          : {
				grab     : "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAVCAYAAACpF6WWAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAVBJREFUeNq8lNtqAjEQhjfr1hNCr3vZV+gbCCJY6oXg+z+A0lbrWWPTGf0HZtNpTSh04CcxiV/mlHUhhOK/zZEqUoAqrP0J0uVRTK0nX8AHmhZE/472mha4VPMGqZMZWY/0CY6zoDxvk56cu+4nFPEVZ86kOwGXP+Q0yaJLO4i2BmurIrzo/Flm5PcBjAvMwfWD3JwRvj7/SJqRtqVVoJwHAWA/rv63AuWCOUrSEZ1QKxQTxxqcYWuAvUCZvsfGOuv5XR0YcB4BPQuUJzvSgvuO9Jzp7Rb/9+iCC5QnJ3i5gCa3wNgfkT4QqY9fVECi+cCc9EaaJni8gvYSehG9HknDO9ZTXhY7sYFDwYJKGlboXd4bkrf3NLYi2A753+gCWdAiyq94e8AnThuHuwTUay+LXz6yFbzrYYwv97is1p+3oE6loDTOBfS3R+g1T78EGABoDL2O9rWNwgAAAABJRU5ErkJggg==') 6 6, default",
				grabbing : "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABUAAAAVCAYAAACpF6WWAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAOFJREFUeNrslDEOwjAMRTGq0ompTEywcBsO0YkDcwCYOtGpLPESXPFThUASV7AgYemrUWO//rhuyTm3+HbQH/qDUCIK9/wGZdZP4VkpqJsS5F5qHcPV0OQR8QDUUAlqRBvRWdNvLbQRXcMkBbQWcQ7q5kwEatai3tctPxqdB/AAp1PE0LGfu2i0ZkcMXYm2orYExn4ruolsDhrGUeF4EHW4JqHj5gWJrDhpD3HpM/VzusfVZIAnmOBwBKs3yQynBj1uElCLfr6cqEoUMJx08UuInNq5fynvtM44HUKnnnUXYADcMYKw5+rWOgAAAABJRU5ErkJggg==') 6 6, default"
			},
			scrollBarHide   : true,
			scrollX         : false
		}, option);

		// Syncオプションが有効なときはスクロールを同期する
		if ( option.sync || this.length === 1 ) {
			new Skroll(this, option);
		// 無効時はそれぞれスクロールを有効にする
		} else {
			this.each(function() {
				new Skroll($(this), option);
			});
		}
		return this;
	}

	// Skroll
	var Skroll = function(elm, option) {
		var _borderRadius = (option.scrollBarWidth + option.scrollBarBorder * 2) / 2 + "px";
		
		// Option
		this.option = option;
		this.$elm = elm;
		this.$outer = $("<div class='scrollOuter'></div>");
		this.$bar = $("<div class='scrollbar'></div>").css({
			border             : "solid #eee " + this.option.scrollBarBorder + "px",
			position           : "absolute",
			borderRadius       : _borderRadius,
			WebKitBorderRadius : _borderRadius,
			MozBorderRadius    : _borderRadius,
			MsBorderRadius     : _borderRadius,
			cursor             : this.option.cursor.grab,
			backgroundColor    : this.option.scrollBarColor,
			WebkitTransform    : MATRIX
		}).hide();
		this.$images = $("img", elm);
		this.enteringCursor = false;
		this.dragging = false;
		this.draggingX = false;
		this.scrolling = false;
		this.dragTop = 0;
		this.dragLeft = 0;
		this.innerWidth = elm.get(0).offsetWidth,
		this.id = ".scrl" + (Math.floor(Math.random() * 1000) * 5); // イベント識別子
		this.mousedown = "mousedown" + this.id;
		this.mousemove = "mousemove" + this.id;
		this.mouseup = "mouseup" + this.id;
		this.outerHeight = undefined;
		this.diff = undefined;
		this.diffX = undefined;
		this.scrollBarWidth = undefined;
		this.scrollBarHeight = undefined;
		this.innerScrollVal = undefined;
		this.innerScrollValX = undefined;
		this.setUp = undefined;
		this.setUpX = undefined;
		this.imgLoaded = 0;
		this.imgLength = 0;
		this.sideScroll = false;

		// コンテンツの高さがアウターよりも大きければという処理を入れたほうがよさそう
		elm.css("height", "auto");
		this.innerHeight = elm.get(0).offsetHeight;
		// 明示的なwidthの指定があり
		// そのwidthがコンテンツ幅を超えている場合は、横スクロールをONにする
		if ( option.width ) {
			this.sideScroll = true;
			this.$barX = this.$bar.clone();
		}
		// Init
		this.setUpSkroll();
		if ( !MOBILE ) {
			this.eventBind();
		// Mobile init
		} else {
			this.evnetBindMobile();
		}
	};
	Skroll.prototype = {
		getCurrent: function($el) {
			if ( MOBILE ) {
				var _translate =  $el.css("WebkitTransform")
						.replace(/matrix\(([^\(\)]*)\)/, "$1")
						.replace(/,/g, "")
						.split(" ");

				return {
					x: _translate[4] * 1,
					y: _translate[5] * 1
				}
			} else {
				//console.log("get position");
				return {
					x: parseInt($el.css("left"), 10),
					y: parseInt($el.css("top"),  10)
				}
			}
		},
		setNext: function($el, val) { // x, y
			var _defaultVal;
			if ( !val.x || !val.y ) {
				_defaultVal = this.getCurrent($el);
			}
			if ( MOBILE ) {
				$el.css({
					bottom          : val.y || _defaultVal.y,
					WebkitTransform : "matrix(1, 0, 0, 1, " + (val.x || _defaultVal.x) + ", " + (val.y || _defaultVal.y) + ")"
				});
			} else {
				$el.css({
					top  : val.y || _defaultVal.y,
					left : val.x || _defaultVal.x
				});
			}
		},
		setUpScrolling: function(e) {
			var _this = this,
				$outer = this.$outer,
				$bar = this.$bar;

			if ( !_this.setUp ) {
				_this.setUp = true;
			} else {
				return;
			}
			_this.outerHeight = $outer.height();
			_this.diff = _this.innerHeight - _this.outerHeight;
			_this.scrollBarHeight = $bar.get(0).offsetHeight;
			_this.innerScrollVal = _this.diff / (_this.outerHeight - _this.scrollBarHeight);
			_this.dragTop = e ? e.clientY : 0;
			_this.scrolling = _this.dragging ? false : true;
		},
		setUpScrollingX: function(e) {
			var _this = this,
				$outer = this.$outer,
				$barX = this.$barX;

			if ( !_this.setUpX ) {
				_this.setUpX = true;
			} else {
				return;
			}
			_this.outerWidth = $outer.width();
			_this.diffX = _this.innerWidth - _this.outerWidth;
			_this.scrollBarWidth = $barX.width();
			_this.innerScrollValX = _this.diffX / (_this.outerWidth - _this.scrollBarWidth);
			_this.dragLeft = e ? e.clientX : 0;
			_this.scrolling = _this.draggingX ? false : true;
		},
		innerScrolling: function(_barTop) {
			var _this = this,
				_innerTop = _barTop * _this.innerScrollVal,
				// ↑インナーのトップ位置
				_innerScrolling = _barTop >= _this.outerHeight - _this.scrollBarHeight,
				// ↑ドラッグがスクロール許容量を超えてしまったときにtrue
				_maxInnerTop = -(_this.outerHeight - _this.scrollBarHeight) * _this.innerScrollVal,
				// ↑インナーの最大トップ位置
				$bar = _this.$bar,
				$elm = _this.$elm;

			_this.setNext($bar, {
				y: _barTop <= 0
					? 0 : _innerScrolling
						? _this.outerHeight - _this.scrollBarHeight : _barTop
			});
			_this.setNext($elm, {
				y: !_innerScrolling
					? _innerTop <= 0
						? 0 : -_innerTop : _maxInnerTop
			});
		},
		innerScrollingX: function(_barLeft) {
			var _this = this,
				_innerLeft = _barLeft * _this.innerScrollValX,
				// ↑インナーのレフト位置
				_innerScrolling = _barLeft >= _this.outerWidth - _this.scrollBarWidth,
				// ↑ドラッグがスクロール許容量を超えてしまったときにtrue
				_maxInnerLeft = -(_this.outerWidth - _this.scrollBarWidth) * _this.innerScrollValX,
				// ↑インナーの最大レフト位置
				$barX = _this.$barX,
				$elm = _this.$elm;

			$barX.css({
				left: _barLeft <= 0
						? 0 : _innerScrolling
							? _this.outerWidth - _this.scrollBarWidth : _barLeft
			});
			if ( !_innerScrolling ) {
				$elm.css({
					left: _innerLeft <= 0 ? 0 : -_innerLeft
				});
			// スクロールバーが一番下まで移動したらコンテンツも一番下に
			} else {
				$elm.css({
					left: _maxInnerLeft
				});
			}
		},
		setUpSkroll: function() {
			var _this = this,
				_opt = this.option,
				$elm = this.$elm,
				$bar = this.$bar,
				$images = this.$images,
				$outer = this.$outer,
				$barX = this.$barX ? this.$barX : undefined;

			this.$outer = $elm
				.css({
					margin          : 0,
					width           : _this.sideScroll ?
										parseInt($elm.css("width"), 10)
										: parseInt($elm.css("width"), 10) - _opt.scrollBarSpace,
					height          : "auto",
					overflow        : "auto",
					position        : MOBILE ? "static" : "relative",
					opacity         : 1,
					WebkitTransform : MATRIX
				})
				.wrap(
					$outer
						.css({
							margin        : _opt.margin,
							paddingRight  : _opt.scrollBarSpace,
							paddingBottom : _this.sideScroll ? _opt.scrollBarSpace : 0,
							width         : parseInt(_opt.width,  10) - _opt.scrollBarSpace,
							height        : parseInt(_opt.height, 10),
							position      : "relative",
							overflow      : "hidden",
							outline       : "none"
						})
				)
				.parent()
				.append(
					$bar
						.css({
							width   : _opt.scrollBarWidth,
							height  : Math.pow(parseInt(_opt.height, 10), 2) / _this.innerHeight,
							top     : 0,
							right   : 0,
							opacity : _opt.opacity
						})
				)
				.append($barX ?
					$barX
						.css({
							width   : Math.pow(parseInt(_opt.width, 10), 2) / _this.innerWidth,
							height  : _opt.scrollBarHeight,
							opacity : _opt.opacity,
							bottom  : -$barX.get(0).offsetHeight,
							left    : 0
						})
					: undefined
				);

			// 画像がある場合は画像の読み込み完了を待つ
			if ( $images.length ) {
				_this.imgLength = $images.length;
				$images.each(function() {
					$(this).m5ImgLoad(function() {
						_this.imgLoaded = _this.imgLoaded + 1;
					})
				});

				(function() {
					if ( _this.imgLoaded === _this.imgLength ) {
						_this.innerHeight = $elm.get(0).offsetHeight;
						return;
					}
					setTimeout(arguments.callee, 30);
				}());
			}
		},
		css: function(elm, styles) {
			for ( var i = 0; i < elm.length; i++ ) {
				elm[i].css(styles);
			}
		},
		eventBind: function() {
			var _this = this,
				_barTop = undefined,
				_barLeft = undefined,
				_opt = this.option,
				$bar = this.$bar,
				$barX = this.$barX ? this.$barX : undefined,
				$outer = this.$outer;

			$outer
				.bind("mouseover", function() {
					_this.enteringCursor = true;
					$bar.stop(true, true).fadeIn(_opt.inSpeed);

					if ( !$barX ) return;
					$barX.stop(true, true).fadeIn(_opt.inSpeed);
				})
				.bind("mouseleave", function() {
					_this.enteringCursor = false;
					if ( _this.dragging || _this.draggingX ) {
						return false;
					}
					_this.setUp = false;
					_this.scrolling = false;
					if ( _opt.scrollBarHide ) {
						$bar.fadeOut(_opt.outSpeed);

						if ( !$barX) return;
						$barX.fadeOut(_opt.outSpeed);
					}
				})
				.bind(MOUSEWHEEL, function(e) {
					// detailはwheelDeltaと正負が逆になり
					// 値もwheelDeltaの1/10
					var _delta = Math.round(e.wheelDelta/10) || -e.detail,
						_barTop = _this.getCurrent($bar).y - _delta,
						_barLeft;

					if ( !_opt.scrollX ) {
						if ( !_this.setUp ) _this.setUpScrolling();
						_this.innerScrolling(_barTop);
					} else {
						_barLeft = _this.getCurrent($bar).x - _delta;
						if ( !_this.setUpX ) _this.setUpScrollingX();
						_this.innerScrollingX(_barLeft);
					}
					e.preventDefault();
					// MacのTrackpadとマウスのホイール横スクロールは
					// イベントでは取れないかも
				});

			$bar.bind(_this.mousedown, function(e) {
				_barTop = parseInt($bar.css("top"), 10);
				this.dragTop = e.clientY;
				_this.setUp = false;
				_this.dragging = true;
				_this.scrolling = false;
				_this.setUpScrolling(e);

				_this.css([$html, $bar], {cursor: _opt.cursor.grabbing});

				$document
					.bind(_this.mousemove, function(e) {
						if ( _this.dragging ) {
							_barTop = _barTop + (e.clientY - _this.dragTop);
							_this.dragTop = e.clientY;
							_this.innerScrolling(_barTop);
						}
						return false;
					})
					.bind(_this.mouseup, function() {
						_this.dragging = false;
						_this.setUp = false;
						$document.unbind(_this.mousemove, _this.mouseup);
						$html.css("cursor", "default");
						$bar.css("cursor", _opt.cursor.grab);
						if ( !_this.enteringCursor ) {
							$bar.fadeOut(_opt.outSpeed);
						}
					});
				return false;
			});

			if ( $barX ) {
				$barX.bind(_this.mousedown + "x", function(e) {
					_barLeft = parseInt($barX.css("left"), 10);
					this.dragLeft = e.clientX;
					_this.setUpX = false;
					_this.draggingX = true;
					_this.scrolling = false;
					_this.setUpScrollingX(e);

					$document
						.bind(_this.mousemove + "x", function(e) {
							if ( _this.draggingX ) {
								_barLeft = _barLeft + (e.clientX - _this.dragLeft);
								_this.dragLeft = e.clientX;
								_this.innerScrollingX(_barLeft);
							}
							return false;
						})
						.bind(_this.mouseup + "x", function() {
							_this.draggingX = false;
							_this.setUpX = false;
							$document.unbind(_this.mousemove + "x", _this.mouseup + "x");
							if ( !_this.enteringCursor ) {
								$barX.fadeOut(_opt.outSpeed);
							}
						});
					return false;
				});
			}

			// 他のコンテンツもロードが終わってから
			// スクロールバーをチラ見せする
			$(window).one("load", function() {
				if ( MOBILE ) {
					$bar.fadeIn(_opt.inSpeed);
				} else {
					if ( _opt.scrollBarHide ) {
						$bar
							.fadeIn(_opt.inSpeed)
							.delay(_opt.delayTime)
							.fadeOut(_opt.outSpeed);

						if ( !$barX ) return false;
						$barX
							.fadeIn(_opt.inSpeed)
							.delay(_opt.delayTime)
							.fadeOut(_opt.outSpeed);
					} else {
						$bar.fadeIn(_opt.inSpeed);
						if ( !barX ) return false;
						$barX.fadeIn(_opt.inSpeed);
					}
				}
			});
		},
		evnetBindMobile: function() {
			var _this = this,
				_opt = this.option,
				$bar = this.$bar,
				$barX = this.$barX ? this.$barX : undefined,
				$outer = this.$outer,
				$elm = this.$elm,
				outer = $outer.get(0),
				touching = false,
				touchStartPos = undefined,
				touchEndPosPrev = undefined,
				touchEndPos = undefined,
				acceleration = undefined,
				touchStartTime = undefined,
				touchEndTime = undefined,
				touchSpeed = 0,
				transitionSetUp = {
					WebkitTransitionProperty       : "all",
					WebkitTransitionTimingFunction : "ease",//"cubic-bezier(0.33,0.66,0.66,1)",
					WebkitTransformStyle           : "preserve-3d",
					WebkitTransitionDuration       : "0s",
					WebkitTransformOrigin          : "0 0"
				};

//			$bar.css(transitionSetUp);
//			$elm.css(transitionSetUp);
			_this.css([$bar, $elm], transitionSetUp);

			$("a", $outer).each(function() {
				var $this = $(this),
					anchor = $this.get(0);

				anchor.addEventListener("touchend", function(e) {
					$bar.stop(true, true).hide();
					$this.click();
					e.stopPropagation();
				}, true);
			});
			outer.addEventListener("touchstart", function(e) {
				var _t = e.touches[0];

				touchStartTime = +new Date;
				touching = true;
				touchSpeed = 0;

				_this.enteringCursor = true;
				touchStartPos = {
					x: _t.pageX,
					y: _t.pageY
				};
				e.stopPropagation();
				//e.preventDefault();
			}, false);
			outer.addEventListener("touchmove", function(e) {
				var _t = e.touches[0];

				touchEndPosPrev = touchEndPos || touchStartPos;
				touchEndPos = {
					x: _t.pageX,
					y: _t.pageY
				};
				var _diffY = (touchEndPosPrev.y - touchEndPos.y) * (2 / 5),
					_diffX = (touchEndPosPrev.x - touchEndPos.x) * (2 / 5),
					// 移動距離が気持ち短い方がなめらかにみえる
					_barCurrent = _this.getCurrent($bar),
					_barTop = _barCurrent.y + _diffY,
					_barLeft;

				// Y scrolling
				if ( !_this.setUp ) {
					//$bar.stop(true, true).fadeIn(_opt.inSpeed);
					$bar.show();
					_this.setUpScrolling();
				}
				_this.innerScrolling(_barTop);
				// X scrolling
				if ( $barX ) {
					_barLeft = parseInt($barX.css("left"), 10) + _diffX;
					if ( !_this.setUpX ) {
						//$barX.stop(true, true).fadeIn(_opt.inSpeed);
						//$barX.show();
						_this.setUpScrollingX();
					}
					_this.innerScrollingX(_barLeft);
				}
				e.preventDefault();
			}, false);
			outer.addEventListener("touchend", function(e) {
				var _diffY = (touchEndPos.y - touchStartPos.y), // タッチの移動距離
					_diffX = (touchEndPos.x - touchStartPos.x), // タッチの移動距離
					_stepY = undefined, // 慣性でバーが進む距離
					_stepX = undefined, // 慣性でバーが進む距離
					_nextY = undefined, // 慣性でバーが進んだ後
					_nextX = undefined, // 慣性でバーが進んだ後
					_nextInnerY = undefined, // 慣性でインナーが進んだ後
					_nextInnerX = undefined, // 慣性でインナーが進んだ後
					//_scrollYDiff = _diffY / _this.innerScrollVal,
					//_scrollXDiff = _diffX / _this.innerScrollValX,
					_barDiff = _this.outerHeight - _this.scrollBarHeight,
					_maxInnerTop = -_barDiff * _this.innerScrollVal,
					_barCurrent = _this.getCurrent($bar);

				touchEndTime = +new Date;
				acceleration = touchEndTime - touchStartTime; // 加速度として使う
				// _diffY * a = 進む距離

				if ( _barCurrent.y >= 0 || _barCurrent.y >= -_barDiff ) {

					_stepY = -_diffY * acceleration / 250; // 慣性でバーが進む距離
					_stepX = -_diffX * acceleration / 250; // 慣性でバーが進む距離
					_nextY = _barCurrent.y + _stepY;
					_nextInnerY = -_nextY * _this.innerScrollVal;

//					$elm.css("WebkitTransitionDuration", ".35s");
//					$bar.css("WebkitTransitionDuration", ".35s");
					_this.css([$elm, $bar], {WebkitTrasitionDuration: ".35s"});

					_this.setNext($elm, {
						y: _nextInnerY >= 0
							? 0 : _nextInnerY <= _maxInnerTop
								? _maxInnerTop : _nextInnerY
					});
					_this.setNext($bar, {
						y: _nextY <= 0
							? 0 : _nextY >= _barDiff
								? _barDiff : _nextY
					});
					setTimeout(function() {
//						$bar.css("WebkitTransitionDuration", "0");
//						$elm.css("WebkitTransitionDuration", "0");
						_this.css([$elm, $bar], {WebkitTrasitionDuration: "0s"});
//						$elm.css("WebkitTransitionProperty", "bottom");
//						$elm.css("WebkitTransitionProperty", "bottom");

						//$bar.delay(150).fadeOut(_opt.outSpeed);
					}, 300);
				} else {
					//$bar.fadeOut(_opt.outSpeed);
					//if ( $barX ) $barX.fadeOut(_opt.outSpeed);
				}

				touching = false;
				touchStartPos = touchEndPos = 0;

				_this.enteringCursor = false;
				_this.setUp = false;
				_this.setUpX = false;
				_this.scrolling = false;
				e.preventDefault();
			}, false);
		}
	};

	/**
	 * m5ImgLoad
	 *
	 * @version      0.2
	 * @author       nori (norimania@gmail.com)
	 * @copyright    5509 (http://5509.me/)
	 * @license      The MIT License
	 * @link         https://github.com/5509/m5ImgLoad
	 *
	 * 2011-02-08 15:41
	 */
 	$.fn.m5ImgLoad = function(callback, interval) {
		var _img = $(this).get(0),
			newImg = new Image();

		newImg.src = _img.src;

		(function() {
			if ( newImg.complete ) {
				callback.call($(newImg));
				return;
			}
			setTimeout(arguments.callee, interval || 20);
		}());
		 return this;
	}

}(jQuery, this, this.document));