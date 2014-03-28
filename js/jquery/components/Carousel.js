/**
 * @copyright   2010-2013, The Titon Project
 * @license     http://opensource.org/licenses/bsd-license.php
 * @link        http://titon.io
 */

Toolkit.Carousel = Toolkit.Component.extend(function(element, options) {
    var items, self = this;

    this.component = 'Carousel';
    this.version = '1.3.1';
    this.element = element = $(element);
    this.options = options = this.setOptions(options, element);

    this.items = items = element.find(options.itemsElement).each(function(index) {
        $(this)
            .attr({
                role: 'tabpanel',
                id: self.id('item', index)
            })
            .aria('hidden', (index > 0));
    });

    this.tabs = element.find(options.tabsElement).each(function(index) {
        $(this)
            .data('index', index)
            .attr({
                role: 'tab',
                id: self.id('tab', index)
            })
            .aria({
                controls: self.id('item', index),
                selected: false,
                expanded: false
            });
    });

    this.nextButton = element.find(options.nextElement);
    this.prevButton = element.find(options.prevElement);
    this.index = 0;
    this.timer = null;
    this.stopped = false;

    // Set animation and ARIA
    element
        .aria('live', options.autoCycle ? 'assertive' : 'off')
        .addClass(options.animation)
        .find('.carousel-tabs')
            .attr('role', 'tablist');

    // Set sizes for responsiveness
    switch (options.animation) {
        case 'fade':
            items.item(0).reveal();
        break;
        case 'slide':
            items.parent().css('width', (items.length * 100) + '%');
            items.css('width', (100 / items.length) + '%');
        break;
    }

    // Initialize events
    this.events = {
        'keydown window': 'onKeydown',
        'swipeleft element': 'next',
        'swipeup element': 'next',
        'swiperight element': 'prev',
        'swipedown element': 'prev',
        'click tabs': 'onJump',
        'click nextButton': 'next',
        'click prevButton': 'prev'
    };

    if (options.stopOnHover) {
        this.events['mouseenter element'] = 'stop';
        this.events['mouseleave element'] = 'start';
    }

    this.enable();
    this.fireEvent('init');

    // Start the carousel
    this.reset();
    this.start();
}, {

    /**
     * Go to the item indicated by the index number.
     * If the index is too large, jump to the beginning.
     * If the index is too small, jump to the end.
     *
     * @param {Number} index
     */
    jump: function(index) {
        this.index = index = $.bound(index, this.items.length);

        // Update tabs
        this.tabs
            .removeClass('is-active')
            .aria('toggled', false)
            .item(index)
                .addClass('is-active')
                .aria('toggled', true);

        // Update items
        this.items
            .aria('hidden', true)
            .item(index)
                .aria('hidden', false);

        // Animate!
        var animation = this.options.animation;

        // Don't use conceal() as it causes the animation to flicker
        if (animation === 'fade') {
            this.items
                .removeClass('show')
                .item(index)
                    .reveal();

        } else {
            this.items.parent()
                .css((animation === 'slide-up') ? 'top' : 'left', -(index * 100) + '%');
        }

        this.reset();
        this.fireEvent('jump', index);
    },

    /**
     * Go to the next item.
     */
    next: function() {
        this.jump(this.index + 1);
    },

    /**
     * Go to the previous item.
     */
    prev: function() {
        this.jump(this.index - 1);
    },

    /**
     * Reset the timer.
     */
    reset: function() {
        if (this.options.autoCycle) {
            clearInterval(this.timer);
            this.timer = setInterval(this.onCycle.bind(this), this.options.duration);
        }
    },

    /**
     * Start the carousel.
     */
    start: function() {
        this.element.removeClass('is-stopped');
        this.stopped = false;

        this.fireEvent('start');
    },

    /**
     * Stop the carousel.
     */
    stop: function() {
        this.element.addClass('is-stopped');
        this.stopped = true;

        this.fireEvent('stop');
    },

    /**
     * Event handler for cycling between items.
     * Will stop cycling if carousel is stopped.
     *
     * @private
     */
    onCycle: function() {
        if (!this.stopped) {
            this.fireEvent('cycle', this.index);
            this.next();
        }
    },

    /**
     * Event handler for jumping between items.
     *
     * @private
     * @param {jQuery.Event} e
     */
    onJump: function(e) {
        e.preventDefault();

        this.jump($(e.currentTarget).data('index') || 0);
    },

    /**
     * Event handle for keyboard events.
     *
     * @private
     * @param {jQuery.Event} e
     */
    onKeydown: function(e) {
        if ($.inArray(e.keyCode, [37, 38, 39, 40]) >= 0) {
            e.preventDefault();
        } else {
            return;
        }

        switch (e.keyCode) {
            case 37: this.prev(); break;
            case 38: this.jump(0); break;
            case 39: this.next(); break;
            case 40: this.jump(-1); break;
        }
    }

}, {
    animation: 'slide',
    duration: 5000,
    autoCycle: true,
    stopOnHover: true,
    itemsElement: '.carousel-items li',
    tabsElement: '.carousel-tabs a',
    nextElement: '.carousel-next',
    prevElement: '.carousel-prev'
});

/**
 * Defines a component that can be instantiated through carousel().
 */
Toolkit.create('carousel', function(options) {
    return new Toolkit.Carousel(this, options);
});