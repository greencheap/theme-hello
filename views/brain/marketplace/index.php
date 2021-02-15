<?php $view->script('marketplace-index', 'brain:app/bundle/marketplace-index.js', ['vue' , 'uikit']) ?>
<?php $view->style('brain_module_style', 'brain:dist/css/brain.min.css') ?>

<section id="app" v-cloak>
    <div class="uk-child-width-1-2@s" uk-grid>
        <div class="uk-flex uk-flex-left@s uk-flex-center">
            <ul class="uk-subnav uk-subnav-pill">
                <li :class="{'uk-active':config.filter.type == 'greencheap-extension'}"><a @click.prevent="setType('greencheap-extension')">{{ 'EXTENSION' | trans }}</a></li>
                <li :class="{'uk-active':config.filter.type == 'greencheap-theme'}"><a @click.prevent="setType('greencheap-theme')">{{ 'THEME' | trans }}</a></li>
            </ul>
        </div>

        <div class="uk-flex uk-flex-right@s uk-flex-center">
            <div class="uk-inline">
                <span class="uk-form-icon uk-form-icon-flip" uk-icon="search"></span>
                <input class="uk-input uk-width-medium@s uk-text-center" v-model="config.filter.search" :placeholder=" 'Search Package' | trans ">
            </div>
        </div>
    </div>

    <div class="uk-section uk-section-xsmall">
        <div class="uk-grid uk-child-width-1-3@m uk-child-width-1-2@s uk-grid-match" uk-grid>
            <div v-for="pkg in pkgs">
                <div class="uk-card tm-marketplace-item" @click.prevent="goTo(pkg.url)">
                    <div class="uk-card-media-top">
                        <img class="tm-marketplace-image tm-image-shadow" :src="pkg.image.src" :alt="pkg.image.alt">
                    </div>
                    <div class="uk-card-body uk-card-small">
                        <h4 class="uk-margin-remove">{{pkg.title}}</h4>
                        <span class="uk-display-block uk-text-small uk-text-muted">{{pkg.author}}</span>
                    </div>
                </div>
            </div>
        </div>
        <div class="uk-flex uk-flex-center">
            <paginate
            v-show="pages > 1 || config.page > 0"
            :page-count="pages"
            :click-handler="paginationClick"
            :margin-pages="1"
            :container-class="'uk-pagination'"
            :initial-page="0"
            :active-class="'uk-active'"
            :prev-text="'Prev' | trans"
            :next-text="'Next' | trans"
            >
            </paginate>
        </div>
        <div v-show="pkgs && !pkgs.length" class="uk-section uk-section-xlarge">
            <h3 class="uk-h2 uk-text-center">{{ 'Packages not found.' | trans }}</h3>
        </div>
    </div>
</section>