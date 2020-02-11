import Settings from '../../components/admin/editor-model/edit-settings.vue';
window.EditorModelEdit = {
    el  : '#app',
    name: 'EditorModelEdit',
    data(){
        return _.merge({
            active: 0,
            model : _.merge({

            } , window.$data.model),
            sections: []
        } , window.$data)
    },

    created(){
        const sections = [];
        _.forIn(this.$options.components , (component , name) => {
            if(component.section){
                sections.push(_.extends({name , priorty:0} , component.section));
            }
        });
        this.$set(this , 'sections' , _.sortBy(sections , 'priority'));
        this.resource = this.$resource('');
    },

    mounted(){
        const vm       = this;
        this.tab = UIkit.tab('#tab' , {content:'#content'});

        UIkit.util.on(this.tab.connects , 'show' , (e , tab) => {
            if(tab != vm.tab) return;
            for(const index in tab.toggles){
                if (tab.toggles[index].classList.contains('uk-active')) {
                    vm.$session.set('editormodel.tab.active', index);
                    vm.active = index;
                    break;
                }
            }
        });

        this.tab.show(this.active);
    },

    methods:{
        submit(){
            return true;
        }
    },

    components:{
        settings: Settings
    }
}

Vue.ready(window.EditorModelEdit);