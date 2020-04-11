<template>
    <div uk-grid>
        <div class="uk-width-expand@m">
            <div class="uk-margin">
                <label class="uk-form-label">{{'Content' | trans}}</label>
                <div class="uk-form-controls">
                    <v-editor v-model="node.theme.hero.content" :options="{markdown : false}" />
                </div>
            </div>
        </div>
        <div class="uk-width-large@m">
            <div class="uk-margin">
                <label class="uk-form-label">{{'Hero Active' | trans}} <input type="checkbox" v-model="node.theme.hero.is_active" class="uk-checkbox"></label>
            </div>
            <div class="uk-margin">
                <label class="uk-form-label">{{'Section' | trans}}</label>
                <div class="uk-form-controls">
                    <input type="text" v-model="node.theme.hero.section" class="uk-input uk-form-large uk-width-expand">
                </div>
            </div>
            <div class="uk-margin">
                <label class="uk-form-label">{{'Flex' | trans}}</label>
                <div class="uk-form-controls">
                    <input type="text" v-model="node.theme.hero.flex" class="uk-input uk-form-large uk-width-expand">
                </div>
            </div>
            <div class="uk-margin">
                <label class="uk-form-label">{{'Image Background' | trans}}</label>
                <div class="uk-form-controls">
                    <input type="text" v-model="node.theme.hero.background.style" class="uk-input uk-form-large uk-width-expand">
                </div>
            </div>
            <div class="uk-margin">
                <label class="uk-form-label">{{'Image Src' | trans}}</label>
                <div class="uk-form-controls">
                    <input type="text" v-model="node.theme.hero.background.src" class="uk-input uk-form-large uk-width-expand">
                </div>
            </div>
            <div class="uk-margin">
                <label class="uk-form-label">{{'Inverse' | trans}}</label>
                <div class="uk-form-controls">
                    <select class="uk-select uk-width-expand" v-model="node.theme.hero.inverse">
                        <option value="">Default</option>
                        <option value="uk-light">Light</option>
                        <option value="uk-dark">Dark</option>
                    </select>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
    let hero = {
        props:['node'],

        section:{
            label:'Hero',
            priority:2
        }
    }

    export default hero;
    window.Site.components['node-hero'] = hero;
</script>