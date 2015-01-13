// Array randomizer from http://www.kirupa.com/html5/shuffling_array_js.htm
Array.prototype.shuffle = function () {
    var input = this;
     
    for (var i = input.length-1; i >=0; i--) {
     
        var randomIndex = Math.floor(Math.random()*(i+1)); 
        var itemAtIndex = input[randomIndex]; 
         
        input[randomIndex] = input[i]; 
        input[i] = itemAtIndex;
    }
    return input;
}

var inf = {
    property: '',
    articles: [],
    checkpoint: { top: 0, bottom: 0 },
    checkpoints: [{ top: 0, bottom: 0}],
    tid: 'dpArticleBottom', // The 't' stands for 'trigger,' as in the id of the element that triggers the next article.
    article_count: 0,   // How many articles we've loaded
    article_position: 0,   // Which article we're on.
    in_dev: 0,  // Set to 1 if dev conditions are met in init() method.
    reload_chartbeat: 0,    // Set to 1 if you want chartbeat to track the new PV.
    reload_comments: 0, // Set to 1 to load comments at the end of each article.
    reload_outbrain: 1,     // Set to 1... you know the drill.
    set_ie: function () 
    {
        // Adapted from http://extras.mnginteractive.com/live/js/jquery/jBar/jBar_btown.js
        if ( document.all ) 
        {
            if ( window.atob ) { return 10; }
            else if ( document.addEventListener ) { return 9; }
            else if ( document.documentMode ) { return 8; }
            else if ( window.XMLHttpRequest ) { return 7; }
        }
    },
    ie_version: 100,
    get_article_id: function get_article_id()
    {
        var ci_ = /ci_([0-9]+)*/i;
        var article_id = ci_.exec(document.location.pathname);
        return article_id[1];
    },
    original_article: { 
        // We do that replace because in omniture all double-quotes are converted to single.
        title: $.trim($('h1#articleTitle').text().replace(/"/g,"'")),
        path: window.location.pathname
    },
    height: { 
        body: function() { return $('body').height(); }, 
        element: function() { return $('#' + this.tid).height(); }
    },
    article_skeleton: function(url) {
        var markup = '\n\
    <div id="articleOverline" class="articleOverline"></div>\n\
    <h1 id="articleTitle" class="articleTitle"></h1>\n\
    <div id="articleByline" class="articleByline">\n\
        <i></i>\n\
        <div id="articleDate" class="articleSecondaryDate meta">\n\
            Posted: &nbsp; <span id="date_published"></span>\n\
            <span id="dateUpdated" title="">Updated: &nbsp; <span></span></span>\n\
        </div>\n\
    </div>\n\
    <div><em class="shareLink"></em></div>\n\
    <div id="articleBodyWrapper"></div>\n\
    <div><em class="commentLink"></em></div>\n\
    ';
        if ( this.reload_outbrain !== 0 )
        {

            markup += '<div id="articleFooter" class="dpArticleBottom">\n\
    <div class="dpArticleTabs">\n\
        <ul>\n\
            <li class="dpArticleTab dpActiveTab nohov">Related Stories</li>\n\
            <li class="dpArticleTab" onclick="window.location.href = ' + url + '#disqus_thread;">Discussion</li>\n\
            <div class="clear"></div>\n\
        </ul>\n\
        <div class="clear"></div>\n\
    </div>\n\
    <div class="dpArticleBottomWrap">\n\
        <div id="dpArticleRelatedDump" class="dpArticleDump dpActiveDump">\n\
\n\
            <div class="OUTBRAIN" data-src="http://www.' + this.property + '.com' + url + '" data-widget-id="AR_2" data-ob-template="DenverPost"></div>\n\
\n\
            <div class="clear"></div>\n\
        </div>\n\
        <div class="clear"></div>\n\
    </div>\n\
    <div class="clear"></div>\n\
</div>';
        }
        else
        {
            markup += '<div id="articleFooter">&nbsp;</div>\n';
        }
        return markup;
    },
    get_top: function()
    {
        // Returns the pixel value of the top of the element that will trigger an article change.
        try
        {
            var value = Math.round($('#' + this.tid).offset().top);
        }
        catch(e)
        {
            console.error('inf.get_top has no .top', this.tid);
        }
        return value;
    },
    previous_scroll: $(window).scrollTop(),
    get_scroll: function() 
    { 
        // This function is the trigger which ignites the next / prev article.
        // It returns a pixel value halfway down the visible screen.
        return $(document).scrollTop() + ( Math.floor(window.innerHeight / 2) );
    },
    escape_regex: function(value)
    {
        return value.replace(/([.*+?\^=!:${}()|\[\]\/\\])/g, "\\$1");
    },
    load_omniture: function load_omniture(new_title, new_id)
    {
        // Reload the existing omniture, which is in a div with an id named "wait"
        var omni = $('#wait').html();
        var title = new RegExp(this.escape_regex($.trim(this.original_article.title)), 'gi');
        var id = new RegExp(this.original_article.id, 'gi');

        var new_omni = omni.replace(title, new_title);
        //if ( this.in_dev !== 0 ) { console.log("NEW_OMNI: ", new_omni, "\nTITLE: ", $.trim(this.original_article.title), title); }
        new_omni = new_omni.replace(id, new_id);
        $('#wait').after('<div id="new_omni">' + new_omni + '</div>');
    },
    build_url: function build_url(path)
    {
        // Return the path part of a URL. It will look something like:
        // "/news/ci_26331707/woman-charged-murder-after-hitting-husband-car"

        // If we're scrolling back up to the top article, the type of path will be a string
        // consisting of the path that we need, so we just use that instead.
        var url = '';
        if ( typeof path === 'object' ) 
        { 
            url = path.prefix + path.id + '/' + path.suffix; 
        }
        else if ( typeof path === 'string' )
        {
            url = path;
        }
        return url;
    },
    rewrite_url: function rewrite_url(path, new_title) 
    {
        // Change the URL in the address bar to reflect the current article.
        // The path is an object with three parts: prefix, article id, and suffix.
        // We separate the path into these three strings because we need access to
        // the article id in other parts of this object.
        var url = this.build_url(path);
        if ( document.location.hash === '#dev' ) { window.history.pushState('', new_title, url + '?source=infinite#dev'); }
        else { window.history.pushState('', new_title, url + '?source=infinite'); }
    },
    ad_slot_id: 1,
    generate_next_slot_id: function()
    {
        this.ad_slot_id ++;
        return 'adslot' + this.ad_slot_id;
    },
    load_ad: function() 
    {
        // Generate next slot name
        var slot_id = this.generate_next_slot_id();
        jQuery('#region4').append('<div id="' + slot_id + '"></div>');

        // Sometimes, say, every other time, let's load a large ad.
        var ad_params = {
            height: '250',
            query: '?property=' + this.property
        };
        if ( this.ad_slot_id % 2 === 0 ) 
        {
            //ad_params.query += '&amp;ad=tall';
            //ad_params.height = '600';
        }
        jQuery("#" + slot_id).html("<iframe src='http://extras.denverpost.com/ad/ad.html" + ad_params.query + "' seamless scrolling='no' frameborder='0' width='300' height='" + ad_params.height + "'></iframe>");
        jQuery("#" + slot_id).css({'top': this.checkpoint.bottom + 'px', 'position': 'absolute'});
    },
    is_loading: 0,
    load_article: function() 
    {
        // If we're out of articles, return false.
        if ( this.article_count + 1 > this.articles.length ) 
        {
            //this.article_count -= 1;
            return false;
        }
        if ( this.is_loading === 1 )
        {
            if ( this.in_dev === 1 ) { console.log("ARTICLE ALREADY LOADING, EXITING load_article()"); }
            return false;
        }

        if ( this.in_dev === 1 ) { console.log("NEW ARTICLE LOADING: ", this.article_count); }
        this.is_loading = 1;
        try
        {
            var article_id = 'article0' + this['article_count'];
            var the_article = this.articles[this['article_count']];

            $('#' + this['tid']).after('<div style="margin-bottom:250px;" class="next-article articleBox" id="' + article_id + '"></div>');
            //$('#' + this['tid']).remove();
            $('#' + article_id).html(this.article_skeleton(this.build_url(the_article.path)));

            // The dates take some finessing, so we hide them until we're ready.
            $('#' + article_id + ' #articleDate').hide();
            var current_year = new Date().getFullYear();

            // Replace the articles in the skeleton article with actual content
            $('#' + article_id + ' #articleOverline').text(the_article.overline);
            $('#' + article_id + ' #articleTitle').text(the_article.title);
            $('#' + article_id + ' #articleByline i').html(the_article.byline);
            $('#' + article_id + ' #date_published').text(the_article.date_published.replace(current_year, ''));
            $('#' + article_id + ' #dateUpdated span').text(the_article.date_updated.replace(current_year, ''));
            $('#' + article_id + ' .shareLink').html('<a href="' + this.build_url(the_article.path) + '#articleOverline">Share this article</a>');
            //$('#' + article_id + ' .commentLink').html('<a href="' + this.build_url(the_article.path) + '#disqus_thread">Comment / read comments on this article</a>');

            $('#' + article_id + ' #articleBodyWrapper').prepend(the_article.body);

            if ( the_article.date_updated === '' ) { $('#' + article_id + ' #dateUpdated').hide(); }
            else { $('#' + article_id + ' #dateUpdated').show(); }
            $('#' + article_id + ' #articleDate').show();

            // If we're outbraining it, outbrain it.
            if ( this.reload_outbrain !== 0 )
            {
                OBR.extern.researchWidget();
            }
        }
        catch (e)
        {
            if ( this.in_dev === 1 ) { console.log("ERROR: ", e); }
        }
        if ( this.in_dev === 1 ) { console.log("ARTICLE LOADED"); }
        this.is_loading = 0;
        return 1;

    },
    check_scroll: function() 
    { 
        // If get_scroll's value is greater than get_top + half the height of the viewport,
        // we load the next article.
        // We'll also need some different logic for scrolling up.

        // We need to know which direction we're scrolling.
        var direction = 'up';
        if ( $(document).scrollTop() > this.previous_scroll ) { direction = 'down'; }

        this.previous_scroll = $(document).scrollTop();

        if ( this.in_dev === 1 )
        {
            console.log("Next Checkpoints (bottom, top):", this.checkpoint.bottom, this.checkpoint.top, "\nCurrent top scroll position:", this.get_scroll(), "\nWe're on article", this.article_position, "and have loaded", this.article_count, "articles, out of", this.articles.length, "total articles.\nCurrent checkpoints: ", this.checkpoint, this.checkpoints); 
            //console.log(this.article_position, this.articles);
            //console.log("Current article: ", this.article_position, "/", this.articles.length, this.articles[this.article_position].title, "\nLast article loaded:", this.article_count, "/" . this.articles.length, this.articles[this.article_count].title);
        }

        if ( this.get_scroll() > this.checkpoint.bottom && direction === 'down' ) 
        {
            // ************************
            // GOING DOWN
            // ************************
            //
 
            // This makes sure we're not trying to load an article after we've run out of articles to load.
            //
            // We increase article_position by one because it's a zero-index value,
            // and articles.length is a one-index value.
            this.article_position += 1;
            if ( this.article_position > this.articles.length )
            {
                this.article_position -= 1;
                return false;
            }

            // Pull in the next article into the the_article var for use later.
            var the_article = this.articles[this.article_position];


            // We only load the article if the count (i.e. total articles loaded)
            // is equal to the article position (i.e. article we're looking at)
            if ( this.article_count + 1 === this.article_position )
            {
                this.article_count += 1;
                if ( this.load_article() === 1 )
                {
                    // This fires if we're loading a new article
                    this.tid = 'article0' + this.article_count + ' #articleFooter';
                    this.checkpoints.push({ top: Math.floor(this.checkpoint.bottom), bottom: this.get_top() });
                    this.checkpoint.top = this.checkpoint.bottom;
                    this.checkpoint.bottom = this.get_top();
                }
                else 
                {
                    // This fires if we tried to load a new article but this logic
                    // this.article_count + 1 > this.articles.length
                    // returned true. That logic checks article_count (zero-indexed value of how many articles we've loaded)
                    // against articles.length (total number of articles available),
                    // to make sure we're not loading a non-existent article.
                    // 
                    // This is different than checking article_position against article_length. Somehow.
                    if ( typeof this.checkpoints[this.article_count - 1] !== 'undefined' && typeof this.checkpoints[this.article_count - 1].top !== 'undefined' )
                    {
                        this.checkpoint.top = this.checkpoints[this.article_count - 1].top;
                        this.checkpoint.bottom = this.checkpoints[this.article_count - 1].bottom;
                    }
                    else
                    {
                        // If the above logic failed, we've still got to do something to adjust the checkpoints.
                        //this.checkpoint.top = this.checkpoints[this.article_position].top;
                        //this.checkpoint.bottom = this.checkpoints[this.article_position].bottom;
                    }
                }
            }
            else
            {
                // This fires when we're scrolling down to an article that
                // we've already loaded on the page. We still need to adjust 
                // the checkpoints for the next article, and rewrite the URL.
                this.checkpoint.top = this.checkpoints[this.article_position].top;
                this.checkpoint.bottom = this.checkpoints[this.article_position].bottom;
            }

            this.load_omniture(the_article.title, the_article.path.id);
            this.rewrite_url(the_article.path, the_article.title);
            this.load_ad();

            return 'down';
        }

        if ( this.get_scroll() < this.checkpoint.top && direction === 'up' )
        {
            // ************************
            // GOING UP
            // ************************
            // If we're scrolling up, we need to rewrite the URL, and prepare
            // for if we keep scrolling up.
            this.article_position -= 1;
            if ( this.article_position >= 0 ) { var the_article = this.articles[this.article_position]; }

            // We don't pass any arguments to the rewrite_url function if we're
            // scrolling up to the top article. It's this way because the first
            // article element in the articles array isn't as complete as the
            // rest of the articles. It's not as complete because it's the article
            // that loads with the original page.
            //if ( this.article_position < 0 ) { this.rewrite_url(); }
            if ( this.article_position === -1 ) { this.rewrite_url(this.original_article.path, this.original_article.title); }
            else { this.rewrite_url(the_article.path, the_article.title); }

            this.checkpoint = this.checkpoints[this.article_position];

            return 'up';
        }
        return false;
    },
    init: function() 
    {
        if ( document.location.hash === '#infinite' || document.location.hash === '#dev' || document.location.hash === '#devbeta' ) { this.in_dev = 1; }

        // Prepend the array with the information *we may need* (most of it we don't) from the existing article.
        this.articles.unshift(this.original_article);

        // When we set this object value in the object itself it raises a 
        // "Uncaught TypeError: undefined is not a function" error
        this.original_article.id = this.get_article_id();
        this.original_article.title = $('h1#articleTitle').text().replace(/"/g,"'");

        // Make sure the articles array doesn't have the original article, the one we're already on.
        // We start counting at 1 because 0 is the original article.
        for ( var i = 1; i < this.articles.length; i ++ )
        {
            if ( this.original_article.id === this.articles[i].path.id )
            {
                this.articles.splice(i, 1);
            }
        }

        // Checkpoint accuracy.
        this.checkpoint.bottom = this.get_top();
        this.checkpoints[0].bottom = this.get_top();
    }
};
