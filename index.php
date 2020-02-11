<?php
return [
    'name' => 'easyeditor',

    'autoload' => [
        'GreenCheap\\EasyEditor\\' => 'src'
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
                'GreenCheap\\EasyEditor\\Controller\\Admin\\ModelController'
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
