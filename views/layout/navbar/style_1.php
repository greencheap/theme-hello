<div class="uk-navbar-container">
    <nav class="uk-container uk-container-large" uk-navbar="<?= $params->get("theme-navbar-components") ?>">
        <div class="uk-navbar-left">
            <a href="<?= $view->url()->get() ?>" title="<?= $params->get('title') ?>">
                <img src="<?= $view->url()->getStatic($params->get('logo')) ?>" width="200" alt="<?= $params->get('title') ?>">
            </a>
        </div>

        <div class="uk-navbar-right">
            <?= $view->menu('main', 'defined/menu/navbar-nav.php') ?>
            <ul id="social-media" class="uk-navbar-item uk-margin-left uk-subnav">
                <li><a href="https://" uk-icon="facebook"></a></li>
                <li><a href="https://" uk-icon="instagram"></a></li>
                <li><a href="https://" uk-icon="linkedin"></a></li>
            </ul>
            <div class="uk-navbar-item uk-margin-left">
                <a id="navbar-button" href="" class="uk-button uk-button-primary">Button Text</a>
            </div>
        </div>
    </nav>
</div>