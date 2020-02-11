<?php
return [
    'name' => 'easyeditor',

    'autoload' => [
        'Nexis\\EasyEditor\\' => 'src'
    ],

    'menu' => [
        'fpd' => [
            'label' => 'Easy Editor',
            'icon' => 'easyeditor:icon.svg',
            'priority' => 101,
            'url' => '@easyeditor/index',
            'active' => '@easyeditor/index*'
        ]
    ],

    'routes' => [
        'easyeditor' => [
            'name' => '@easyeditor',
            'controller' => [
                'Nexis\\EasyEditor\\Controller\\Admin\\ModelController'
            ]
        ],
        'api/easyeditor' => [
            'name' => '@api/easyeditor',
            'controller' => [
                
            ]
        ]
    ]
];
?>
