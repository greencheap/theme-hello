<?php
return [
    'name' => 'theme-build',

    'menus' => [
        'main' => 'Main'
    ],

    'events' => [
        'view.layout' => function($event , $view) use ($app){
            if($app->isAdmin()){
                return;
            }
            $params = $view->params;
            $params['my_custom_conf'] = 'GreenCheap';
        }
    ]
];
