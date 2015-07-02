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
    article_set: '',
    article_sets: [],
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
    update_article_sets: function ()
    {
        // Make sure that the value of this.article_set no longer exists
        // in this.article_sets. We use these vars to track which sets
        // of articles we've loaded and which we haven't.
        var index = this.article_sets.indexOf(this.article_set);
        if (  index > -1 )
        {
            this.article_sets.splice(index, 1);
        }
    },
    load_article_set: function ()
    {
        // Add articles from a set of articles to the inf object.
        // Update relevant variables.

        if ( this.article_sets.length === 0 ) return false;

        // Get a new article_set value.
        this.article_set = this.article_sets[0];
        this.update_article_sets();

        // Load the articles
        var script = document.createElement('script');
        script.src = 'http://extras.denverpost.com/cache/article/' + this.property + '-' + this.article_set + '.js';
        $('head')[0].appendChild(script);

        // Wait a little bit before continuing. The first line of the downloaded script is
        // var ar = new Array(
        // which means we've got a var named ar that's full with new articles.
        setTimeout( function () {
            window.inf.articles.push.apply(window.inf.articles, window.ar);
        }, 3000);
    },
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
            <li class="dpArticleTab" onclick="window.location.href = ' + url + '#disqus_thread;"><a href="' + url + '#disqus_thread">Discussion</a></li>\n\
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
        value = value.replace(/(\r\n|\n|\r)/gm, "");
        return value.replace(/([.*+?\^=!:${}()|\[\]\/\\])/g, "\\$1");
    },
    load_analytics: function(new_url, new_title)
    {
        // Reload the existing anayltics
        var url = new_url['prefix'] + new_url['id'] + '/' + new_url['suffix'];
        //_gaq.push(['_trackPageview', url]);
        //analyticsVPV = function(virtualPageName) {
            dataLayer.push({
                'event': 'analyticsVPV',
                'vpvName': new_title,
                //'ga_ua':'UA-61435456-7',
                //'quantcast':'p-4ctCQwtnNBNs2',
                //'quantcast label': 'Denver',
                //'comscore':'6035443',
                'errorType':'',
                'Publisher Domain':document.location.host.replace('www.', ''),
                'Publisher Product':document.location.host,
                'Dateline':'',
                'Publish Hour of Day':'',
                'Create Hour of Day':'',
                'Update Hour of Day':'',
                'Behind Paywall':'NO',
                'Mobile Presentation':'NO',
                'kv':'',
                'Release Version':'',
                'Digital Publisher':'',
                'Platform':'NGPS',
                'Section':'Infinite Test',
                'Taxonomy1':'',
                'Taxonomy2':'',
                'Taxonomy3':'',
                'Taxonomy4':'',
                'Taxonomy5':'',
                'Content Source':'',
                'Canonical URL': url,
                'Slug':new_url['suffix'],
                'Content ID':new_url['id'],
                'Page Type':'article',
                'Publisher State':'CO',
                'Byline':'',
                'Content Title':new_title,
                'URL':url,
                'Page Title':new_title + ' - The Denver Post',
                'User ID':''
            });
        //}

    },
    build_url: function(path)
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
    rewrite_url: function rewrite_url(path, new_title, direction) 
    {
        // Change the URL in the address bar to reflect the current article.
        // The path is an object with three parts: prefix, article id, and suffix.
        // We separate the path into these three strings because we need access to
        // the article id in other parts of this object.
        document.title = new_title;
        var url = this.build_url(path);
        if ( direction == 'down' )
        {
            if ( document.location.hash === '#dev' ) { window.history.pushState('', new_title, url + '?source=infinite#dev'); }
            else { window.history.pushState('', new_title, url + '?source=infinite'); }
        }
        else
        {
            if ( document.location.hash === '#dev' ) { window.history.replaceState('', new_title, url + '?source=infinite#dev'); }
            else { window.history.replaceState('', new_title, url + '?source=infinite'); }
        }
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
        var ad_height = 1100;
        var ad_top = this.checkpoint.bottom - ad_height;
        jQuery("#" + slot_id).html("<iframe src='http://extras.denverpost.com/app/infinite/ad.html" + ad_params.query + "' seamless scrolling='no' frameborder='0' width='300' height='" + ad_height + "'></iframe>");
        jQuery("#" + slot_id).css({'top': ad_top + 'px', 'position': 'absolute'});

        // Now do the embedded ad.
        var article_id = 'article0' + this['article_count'];
        jQuery("#" + article_id + ' .articleEmbeddedAdBox').html("<iframe src='http://extras.denverpost.com/app/infinite/ad-embedded.html" + ad_params.query + "' seamless scrolling='no' frameborder='0' width='300' height='300'></iframe>");
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
            else if ( this.article_position === ( this.articles.length - 3 ) )
            {
                // If we're on the third-to-last article, load more.
                this.load_article_set();
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

            this.load_analytics(the_article.path, the_article.title);
            this.rewrite_url(the_article.path, the_article.title, 'down');
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
            if ( this.article_position === -1 ) { this.rewrite_url(this.original_article.path, this.original_article.title, 'up'); }
            else { this.rewrite_url(the_article.path, the_article.title, 'up'); }

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
        this.original_article.title = $('h1#articleTitle').html().replace(/"/g,"'");

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
        // Need to edit these should the article-comments tab get clicked.
        this.checkpoint.bottom = this.get_top() + 200;
        this.checkpoints[0].bottom = this.get_top() + 200;
    }
};

// From http://stackoverflow.com/questions/1354064/how-to-convert-characters-to-html-entities-using-plain-javascript
if(typeof escapeHtmlEntities === 'undefined') 
{
        escapeHtmlEntities = function (text) {
            return text.replace(/[\u00A0-\u2666<>\&]/g, function(c) {
                return '&' + 
                (escapeHtmlEntities.entityTable[c.charCodeAt(0)] || '#'+c.charCodeAt(0)) + ';';
            });
        };

        // all HTML4 entities as defined here: http://www.w3.org/TR/html4/sgml/entities.html
        // added: amp, lt, gt, quot and apos
        escapeHtmlEntities.entityTable = {
            34 : 'quot', 
            38 : 'amp', 
            39 : 'apos', 
            60 : 'lt', 
            62 : 'gt', 
            160 : 'nbsp', 
            161 : 'iexcl', 
            162 : 'cent', 
            163 : 'pound', 
            164 : 'curren', 
            165 : 'yen', 
            166 : 'brvbar', 
            167 : 'sect', 
            168 : 'uml', 
            169 : 'copy', 
            170 : 'ordf', 
            171 : 'laquo', 
            172 : 'not', 
            173 : 'shy', 
            174 : 'reg', 
            175 : 'macr', 
            176 : 'deg', 
            177 : 'plusmn', 
            178 : 'sup2', 
            179 : 'sup3', 
            180 : 'acute', 
            181 : 'micro', 
            182 : 'para', 
            183 : 'middot', 
            184 : 'cedil', 
            185 : 'sup1', 
            186 : 'ordm', 
            187 : 'raquo', 
            188 : 'frac14', 
            189 : 'frac12', 
            190 : 'frac34', 
            191 : 'iquest', 
            192 : 'Agrave', 
            193 : 'Aacute', 
            194 : 'Acirc', 
            195 : 'Atilde', 
            196 : 'Auml', 
            197 : 'Aring', 
            198 : 'AElig', 
            199 : 'Ccedil', 
            200 : 'Egrave', 
            201 : 'Eacute', 
            202 : 'Ecirc', 
            203 : 'Euml', 
            204 : 'Igrave', 
            205 : 'Iacute', 
            206 : 'Icirc', 
            207 : 'Iuml', 
            208 : 'ETH', 
            209 : 'Ntilde', 
            210 : 'Ograve', 
            211 : 'Oacute', 
            212 : 'Ocirc', 
            213 : 'Otilde', 
            214 : 'Ouml', 
            215 : 'times', 
            216 : 'Oslash', 
            217 : 'Ugrave', 
            218 : 'Uacute', 
            219 : 'Ucirc', 
            220 : 'Uuml', 
            221 : 'Yacute', 
            222 : 'THORN', 
            223 : 'szlig', 
            224 : 'agrave', 
            225 : 'aacute', 
            226 : 'acirc', 
            227 : 'atilde', 
            228 : 'auml', 
            229 : 'aring', 
            230 : 'aelig', 
            231 : 'ccedil', 
            232 : 'egrave', 
            233 : 'eacute', 
            234 : 'ecirc', 
            235 : 'euml', 
            236 : 'igrave', 
            237 : 'iacute', 
            238 : 'icirc', 
            239 : 'iuml', 
            240 : 'eth', 
            241 : 'ntilde', 
            242 : 'ograve', 
            243 : 'oacute', 
            244 : 'ocirc', 
            245 : 'otilde', 
            246 : 'ouml', 
            247 : 'divide', 
            248 : 'oslash', 
            249 : 'ugrave', 
            250 : 'uacute', 
            251 : 'ucirc', 
            252 : 'uuml', 
            253 : 'yacute', 
            254 : 'thorn', 
            255 : 'yuml', 
            402 : 'fnof', 
            913 : 'Alpha', 
            914 : 'Beta', 
            915 : 'Gamma', 
            916 : 'Delta', 
            917 : 'Epsilon', 
            918 : 'Zeta', 
            919 : 'Eta', 
            920 : 'Theta', 
            921 : 'Iota', 
            922 : 'Kappa', 
            923 : 'Lambda', 
            924 : 'Mu', 
            925 : 'Nu', 
            926 : 'Xi', 
            927 : 'Omicron', 
            928 : 'Pi', 
            929 : 'Rho', 
            931 : 'Sigma', 
            932 : 'Tau', 
            933 : 'Upsilon', 
            934 : 'Phi', 
            935 : 'Chi', 
            936 : 'Psi', 
            937 : 'Omega', 
            945 : 'alpha', 
            946 : 'beta', 
            947 : 'gamma', 
            948 : 'delta', 
            949 : 'epsilon', 
            950 : 'zeta', 
            951 : 'eta', 
            952 : 'theta', 
            953 : 'iota', 
            954 : 'kappa', 
            955 : 'lambda', 
            956 : 'mu', 
            957 : 'nu', 
            958 : 'xi', 
            959 : 'omicron', 
            960 : 'pi', 
            961 : 'rho', 
            962 : 'sigmaf', 
            963 : 'sigma', 
            964 : 'tau', 
            965 : 'upsilon', 
            966 : 'phi', 
            967 : 'chi', 
            968 : 'psi', 
            969 : 'omega', 
            977 : 'thetasym', 
            978 : 'upsih', 
            982 : 'piv', 
            8226 : 'bull', 
            8230 : 'hellip', 
            8242 : 'prime', 
            8243 : 'Prime', 
            8254 : 'oline', 
            8260 : 'frasl', 
            8472 : 'weierp', 
            8465 : 'image', 
            8476 : 'real', 
            8482 : 'trade', 
            8501 : 'alefsym', 
            8592 : 'larr', 
            8593 : 'uarr', 
            8594 : 'rarr', 
            8595 : 'darr', 
            8596 : 'harr', 
            8629 : 'crarr', 
            8656 : 'lArr', 
            8657 : 'uArr', 
            8658 : 'rArr', 
            8659 : 'dArr', 
            8660 : 'hArr', 
            8704 : 'forall', 
            8706 : 'part', 
            8707 : 'exist', 
            8709 : 'empty', 
            8711 : 'nabla', 
            8712 : 'isin', 
            8713 : 'notin', 
            8715 : 'ni', 
            8719 : 'prod', 
            8721 : 'sum', 
            8722 : 'minus', 
            8727 : 'lowast', 
            8730 : 'radic', 
            8733 : 'prop', 
            8734 : 'infin', 
            8736 : 'ang', 
            8743 : 'and', 
            8744 : 'or', 
            8745 : 'cap', 
            8746 : 'cup', 
            8747 : 'int', 
            8756 : 'there4', 
            8764 : 'sim', 
            8773 : 'cong', 
            8776 : 'asymp', 
            8800 : 'ne', 
            8801 : 'equiv', 
            8804 : 'le', 
            8805 : 'ge', 
            8834 : 'sub', 
            8835 : 'sup', 
            8836 : 'nsub', 
            8838 : 'sube', 
            8839 : 'supe', 
            8853 : 'oplus', 
            8855 : 'otimes', 
            8869 : 'perp', 
            8901 : 'sdot', 
            8968 : 'lceil', 
            8969 : 'rceil', 
            8970 : 'lfloor', 
            8971 : 'rfloor', 
            9001 : 'lang', 
            9002 : 'rang', 
            9674 : 'loz', 
            9824 : 'spades', 
            9827 : 'clubs', 
            9829 : 'hearts', 
            9830 : 'diams', 
            338 : 'OElig', 
            339 : 'oelig', 
            352 : 'Scaron', 
            353 : 'scaron', 
            376 : 'Yuml', 
            710 : 'circ', 
            732 : 'tilde', 
            8194 : 'ensp', 
            8195 : 'emsp', 
            8201 : 'thinsp', 
            8204 : 'zwnj', 
            8205 : 'zwj', 
            8206 : 'lrm', 
            8207 : 'rlm', 
            8211 : 'ndash', 
            8212 : 'mdash', 
            8216 : 'lsquo', 
            8217 : 'rsquo', 
            8218 : 'sbquo', 
            8220 : 'ldquo', 
            8221 : 'rdquo', 
            8222 : 'bdquo', 
            8224 : 'dagger', 
            8225 : 'Dagger', 
            8240 : 'permil', 
            8249 : 'lsaquo', 
            8250 : 'rsaquo', 
            8364 : 'euro'
        };
}
