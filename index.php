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
            'url' => '',
            'active' => ''
        ]
    ],

    'routes' => [
        'easyeditor' => [
            'name' => '@easyeditor',
            'controller' => [
                
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
