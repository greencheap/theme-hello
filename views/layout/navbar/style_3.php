<div class="uk-navbar-container">
    <nav class="uk-container uk-container-large" uk-navbar="<?= $params->get("theme-navbar-components") ?>">
        <div class="uk-navbar-left">
            <?= $view->menu('main', 'defined/menu/navbar-nav.php') ?>
        </div>
        <div class="uk-navbar-center">
            <a href="<?= $view->url()->get() ?>" title="<?= $params->get('title') ?>">
                <img src="<?= $view->url()->getStatic($params->get('logo')) ?>" width="200" alt="<?= $params->get('title') ?>">
            </a>
        </div>
        <div class="uk-navbar-right">
            <?= $view->menu('second', 'defined/menu/navbar-nav.php') ?>
        </div>
    </nav>
</div>