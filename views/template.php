<html lang="<?= str_replace('_', '-', $app['translator']->getLocale()) ?>">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <?= $view->render('head') ?>
        <?php $view->style('theme' , 'theme:assets/dist/css/pro.theme.main.min.css') ?>
        <?php $view->script('theme' , 'theme:app/bundle/theme.js') ?>
    </head>
    <body>
        <?= $view->render('layout/navbar/nav.php') ?>
        <?= $view->render('content') ?>
    </body>
</html>
