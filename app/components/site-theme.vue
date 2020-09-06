<template>
    <div>
        <div class="uk-margin uk-flex uk-flex-middle uk-flex-between uk-flex-wrap">
            <div>
                <h2 class="uk-h3 uk-margin-remove">
                    {{ 'Theme' | trans }}
                </h2>
            </div>
            <div class="uk-margin-small">
                <button class="uk-button uk-button-primary" type="submit">
                    {{ 'Save' | trans }}
                </button>
            </div>
        </div>

        <div class="uk-form uk-form-horizontal">
            <div class="uk-margin">
                <h5 class="uk-heading-line"><span>{{ 'NAVBAR' | trans }}</span></h5>
                <div class="uk-child-width-1-2@m" uk-grid>
                    <div v-for="(style , id) in options.navbar.styles" :key="id">
                        <div @click.prevent="setNavbar(style.path)" :title="style.name" class="uk-card" :class="{
                            'uk-card-secondary':config.navbar.style == style.path,
                            'uk-card-default':config.navbar.style != style.path,
                        }" style="cursor:pointer" uk-tooltip>
                            <img :src="getImage(style.icon)" width="100%">
                        </div>   
                    </div>
                </div>

                <div class="uk-child-width-1-2@m uk-grid-divider" uk-grid>
                    <div>
                        <div class="uk-margin">
                            <div class="uk-form-label">{{ 'Boundary Align' | trans }}</div>
                            <div class="uk-form-controls uk-form-controls-text">
                                <label><input class="uk-checkbox" type="checkbox" v-model="config.navbar.components['boundary-align']"></label>
                            </div>
                        </div>
                        <div class="uk-margin">
                            <label class="uk-form-label">{{ 'Boundary' | trans }}</label>
                            <div class="uk-form-controls">
                                <input class="uk-input uk-width-medium" type="text" v-model="config.navbar.components.boundary" placeholder="window" required>
                            </div>
                        </div>
                        <div class="uk-margin">
                            <div class="uk-form-label">{{ 'Dropbar' | trans }}</div>
                            <div class="uk-form-controls uk-form-controls-text">
                                <label><input class="uk-checkbox" type="checkbox" v-model="config.navbar.components.dropbar"></label>
                            </div>
                        </div>
                        <div class="uk-margin">
                            <label class="uk-form-label">{{ 'Dropbar Mode' | trans }}</label>
                            <div class="uk-form-controls">
                                <input class="uk-input uk-width-medium" type="text" v-model="config.navbar.components['dropbar-mode']" :disabled="!config.navbar.components.dropbar" placeholder="slide" required>
                            </div>
                        </div>
                    </div>
                    <div>
                        <div class="uk-margin">
                            <label class="uk-form-label">{{ 'Delay Show' | trans }}</label>
                            <div class="uk-form-controls">
                                <input class="uk-input uk-width-medium" type="number" v-model="config.navbar.components['delay-show']" required>
                            </div>
                        </div> 
                        <div class="uk-margin">
                            <label class="uk-form-label">{{ 'Delay Hide' | trans }}</label>
                            <div class="uk-form-controls">
                                <input class="uk-input uk-width-medium" type="number" v-model="config.navbar.components['delay-hide']" required>
                            </div>
                        </div>
                        <div class="uk-margin">
                            <label class="uk-form-label">{{ 'Offset' | trans }}</label>
                            <div class="uk-form-controls">
                                <input class="uk-input uk-width-medium" type="number" v-model="config.navbar.components['offset']" required>
                            </div>
                        </div>
                        <div class="uk-margin">
                            <label class="uk-form-label">{{ 'Duration' | trans }}</label>
                            <div class="uk-form-controls">
                                <input class="uk-input uk-width-medium" type="number" v-model="config.navbar.components['duration']" required>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
        </div>
    </div>
</template>

<script>

var SiteTheme = {

    section: {
        label: 'Theme',
        icon: 'pk-icon-large-brush',
        priority: 15,
    },

    data() {
        return _.extend({ config: {} }, window.$theme);
    },

    methods:{
        getImage(str){
            const path = `/packages/greencheap/${this.name}/`;
            return this.$url(str.replace(/theme:/g, path));
        },

        setNavbar(style){
            this.config.navbar.style = style;
        }
    },

    events: {
        'save:settings': function() {
            this.$http.post('admin/system/settings/config', { name: this.name, config: this.config }).catch(function (res) {
                this.$notify(res.data, 'danger');
            });
        },
    },

};

export default SiteTheme;

window.Site.components['site-theme'] = SiteTheme;

</script>
