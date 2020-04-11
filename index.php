<?php
return [
    'name' => 'theme-greencheap',

    'menus' => [
        'main' => 'Main'
    ],

    'node' => [
        'layout' => 'layout/default.php',
        'hero' => [
            'is_active' => false,
            'section' => 'uk-section uk-section-default uk-section-xlarge',
            'flex' => 'uk-flex uk-flex-middle',
            'inverse' => '',
            'background' => [
                'style' => 'uk-background-image uk-background-cover',
                'src' => 'https://res.cloudinary.com/greencheap/image/upload/q_100/v1586534439/hero_type.webp'
            ],
            'content' => ''
        ]
    ],

    'events' => [
        'view.system/site/admin/edit' => function ($event, $view) {
            $view->script('node-hero', 'theme:app/bundle/theme/node-hero.js', 'site-edit');
        }
    ]
];
?>
