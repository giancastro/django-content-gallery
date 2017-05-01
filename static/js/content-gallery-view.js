(function ($) {

    window.ContentGallery = window.ContentGallery || {};

    var galleryView = (function (gallery, animateSync) {
        var $galleryView,
            $imageContainer,
            $image,
            $thumbnails,
            $scrollLeft,
            $scrollRight,
            $choices,
            $thumbnailsView,
            $imageView,
            $thumbnailsContainer;

        var winWidth, winHeight, thumbnailWidth, maxOffset;
        var ready = false;

        function isSmall() {
            return ContentGallery.isSmallHelper(gallery.getImageSize().width + 220,
                gallery.getImageSize().height + gallery.getThumbnailSize().height + 85);
        }

        function checkScrollButtons(left) {
            if (left < 0)
                $scrollLeft.removeClass("content_gallery_inactive");
            else
                $scrollLeft.addClass("content_gallery_inactive");

            if (left > maxOffset)
                $scrollRight.removeClass("content_gallery_inactive");
            else
                $scrollRight.addClass("content_gallery_inactive");
        }

        function scrollToImage(index) {
            left = parseInt($thumbnails.css("left"));
            begin = thumbnailWidth * index;
            end = thumbnailWidth * (index + 1);

            if (left + begin >= 0 && left + end <= $thumbnailsContainer.width())
                return;

            if (left + begin < 0)
                newLeft = -begin;

            if (left + end > $thumbnailsContainer.width())
                newLeft = $thumbnailsContainer.width() - end;

            animateSync.safeAnimate($thumbnails, {left: newLeft}, null);
            checkScrollButtons(newLeft);
        }

        function setImage(index, callback) {
            img = gallery.getImage(index);
            if (!img) return;
            $choices.addClass("choice");
            $($choices[index]).removeClass("choice");
            if (isSmall()) {
                src = img.small_image;
                size = img.small_image_size;
            } else {
                src = img.image;
                size = img.image_size;
            }
            callback(size, src);
        }

        function setImageAnim(index) {
            setImage(index, function (size, src) {
                animateSync.safeAnimate($image, {width: 0, height: 0}, function () {
                    $image.attr("src", src);
                    animateSync.safeAnimate($image, {width: size.width, height: size.height}, null);
                });
            });
        }

        function setImageFast(index) {
            setImage(index, function (size, src) {
                $image.attr("src", src).css({width: size.width, height: size.height});
            });
        }

        function slideImage(index) {
            setImageAnim(index);
            scrollToImage(index);
        }

        function setThumbnailViewSize(imgSize, thumbnailSize) {
            $thumbnails.width(thumbnailWidth * gallery.count());

            container_width = Math.ceil(imgSize.width / thumbnailWidth) * thumbnailWidth;
            if (container_width > imgSize.width + 140)
                container_width -= thumbnailWidth;

            $thumbnailsView.width(container_width + 60);
            $choices.width(thumbnailSize.width)
                    .height(thumbnailSize.height)
                    .css("line-height", (thumbnailSize.height - 2) + "px");
            $thumbnailsView.height(thumbnailSize.height + 2);
            $thumbnailsContainer.width(container_width);
        }

        function setGalleryViewSize(imgSize, thumbnailSize) {
            ContentGallery.setViewSizeHelper($galleryView, $imageView, $imageContainer,
                                            imgSize.width, imgSize.height, 200, thumbnailSize.height + 45);
        }

        function setGalleryViewPosition() {
            ContentGallery.setViewPositionHelper($galleryView);
        }

        function nextImage() {
            animateSync.safeRun(function () {
                index = gallery.next();
                slideImage(index);
            });
        }

        function previousImage() {
            animateSync.safeRun(function () {
               index = gallery.prev();
               slideImage(index);
            });
        }

        function setImageByIndex(index) {
            animateSync.safeRun(function () {
                setImageAnim(index);
            });
        }

        function scrollLeft() {
            animateSync.safeRun(function () {
                left = parseInt($thumbnails.css("left"));
                if (left < 0) {
                    animateSync.safeAnimate($thumbnails, {left: "+=" + thumbnailWidth}, null);
                    checkScrollButtons(left + thumbnailWidth);
                }
            });
        }

        function scrollRight() {
            animateSync.safeRun(function () {
                left = parseInt($thumbnails.css("left"));
                if (left > maxOffset) {
                    animateSync.safeAnimate($thumbnails, {left: "-=" + thumbnailWidth}, null);
                    checkScrollButtons(left - thumbnailWidth);
                }
            });
        }

        function resize() {
            if (!ready) return;

            imgSize = isSmall() ? gallery.getSmallImageSize() : gallery.getImageSize();
            thumbnailSize = gallery.getThumbnailSize()
                
            thumbnailWidth = thumbnailSize.width + 8;

            setThumbnailViewSize(imgSize, thumbnailSize);

            maxOffset = $thumbnailsContainer.width() - $thumbnails.width();

            checkScrollButtons(0);

            setGalleryViewSize(imgSize, thumbnailSize);
            setGalleryViewPosition();

            index = gallery.current();
            setImageFast(index);
        }

        function init(app_label, content_type, object_id) {
            $galleryView = $("#content_gallery_view");
            $imageView = $("#content_gallery_image_view");
            $imageContainer = $(".content_gallery_image_container");
            $image = $(".content_gallery_image_container > img");
            $thumbnailsView = $("#content_gallery_thumbnails_view");
            $scrollLeft = $(".content_gallery_scroll_left");
            $scrollRight = $(".content_gallery_scroll_right");
            $thumbnailsContainer = $(".content_gallery_thumbnails_container");
            $thumbnails = $(".content_gallery_thumbnails_container > ul");

            if (!ready) {
                $thumbnails.on("click", "li.choice", function () {
                    setImageByIndex($(this).index());
                });

                $(".content_gallery_prev_image").click(previousImage)
                $(".content_gallery_next_image").click(nextImage);
                $scrollLeft.click(scrollLeft);
                $scrollRight.click(scrollRight);
            }

            $thumbnails.empty();

            gallery.load(app_label, content_type, object_id, function (data) {
                $.each(data, function (index, img) {
                    $thumbnails.append($("<li></li>")
                                .addClass("choice")
                                .append($("<img>")
                                    .attr("src", img.thumbnail)
                                    )
                                );
                });

                $choices = $thumbnails.children();

                ready = true;
                resize();

                $("#content_gallery").show();
            });
        }

        return {
            init: init,
            resize: resize
        };
    })(ContentGallery.gallery, ContentGallery.animateSync);

    ContentGallery.galleryView = galleryView;

    $(window).resize(galleryView.resize);

    $(function () {
        $(".open_gallery").click(function() {
            matches = $(this).attr("id").match(/^gallery-(\w+)-(\w+)-(\d+)$/i);
            if (!matches) return;
            app_label = matches[1];
            content_type = matches[2];
            object_id = matches[3];
            galleryView.init(app_label, content_type, object_id);
        });

        $(".content_gallery_close").click(function() {
            $("#content_gallery").hide();
        });
    });
})(jQuery);
