<html lang="<?= str_replace('_', '-', $app['translator']->getLocale()) ?>">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <?= $view->render('head') ?>
        <?php $view->style('theme-uikit' , 'theme:dist/css/uikit.greencheap.min.css') ?>
        <?php $view->style('theme-less' , 'theme:dist/css/theme-greencheap.min.css') ?>
        <?php $view->script('theme-javascript' , 'theme:app/bundle/main.theme.js' , 'vue') ?>
    </head>
    <body>
        <?= $view->render('layout/navbar/default.php') ?>
    </body>
</html>
