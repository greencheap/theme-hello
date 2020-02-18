<?php
return [
    'enable' => function ($app) {
        $util = $app['db']->getUtility();
    },
    'disable' => function ($app) {
        $util = $app['db']->getUtility();
    },
    'updates' => []
];
