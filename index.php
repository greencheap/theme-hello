<?php

use Symfony\Component\Yaml\Yaml;

$packageName = 'pro-theme-main';

return [
    'name' => $packageName,

    'menus' => [
        'main' => 'Main',
        'second' => 'Second',
    ],

    'positions' => [
        'header-left' => 'Header Left',
        'header->right' => 'Header Right',
    ],

    'config' => [
        'navbar' => [
            'style' => 'layout/navbar/style_1.php',
            'components' => ['delay-show' => 0, 'delay-hide' => 100, 'boundary' => 'window', 'boundary-align' => false, 'offset' => 0, 'dropbar' => false, 'dropbar-mode' => 'slide', 'duration' => 200]
        ]
    ],

    'events' => [
        'view.system/site/admin/settings' => function ($event, $view){
            $navbar = Yaml::parseFile($this->get('path').'/views/layout/navbar/define.yml');
            $view->script('site-theme', 'theme:app/bundle/site-theme.js', 'site-settings');
            $view->data('$theme', [
                'name' => $this->get('name'),
                'options' => [
                    'navbar' => $navbar,
                ],
                'config' => $this->get('config')
            ]);
        },

        'view.layout' => function($event , $view) use ($app){
            if($app->isAdmin()){
                return;
            }
                 
            $params = $view->params;
            $params['my_custom_conf'] = 'GreenCheap';

            /**
             * uk-navbar="components" ayırıcı
             */
            $params['theme-navbar-components'] = '';
            foreach($params->get('navbar.components') as $key => $value){
                $data = '';
                $data = $data."'$key':";
                if(is_string($value)){
                    $data = $data."'$value';";
                }else if(is_bool($value)){
                    $data = $data.$value ? true:false;
                }else{
                    $data = $data."$value;";  
                }
                $params['theme-navbar-components'] = $params['theme-navbar-components'].$data;
            };
            /**
             * uk-navbar="components" ayırıcı bitiş
             */
        }
    ]
];
