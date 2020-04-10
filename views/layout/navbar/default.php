<div class="uk-navbar-container">
    <nav class="uk-container uk-container-xlarge" uk-navbar>
        <div class="uk-navbar-left">
            <a class="uk-navbar-brand uk-navbar-item" href="<?= $view->url()->get() ?>">
                <img src="<?= $app['url']->getStatic('theme:assets/logo-green.svg') ?>" alt="GreenCheap Logo" width="200">
            </a>
        </div>
        <div class="uk-navbar-center">
            <?php if( $view->menu()->exists('main') ): ?>
                <?= $view->menu('main' , 'defined/menu/navbar-nav.php') ?>
            <?php endif ?>
            <ul class="uk-navbar-item tm-iconnav uk-iconnav">
                <li><a class="tm-icon-facebook" href="#" target="_blank" uk-icon="icon: facebook;ratio:0.7"></a></li>
                <li><a class="tm-icon-instagram" href="#" target="_blank" uk-icon="icon: instagram;ratio:0.7"></a></li>
                <li><a class="tm-icon-twitter" href="#" target="_blank" uk-icon="icon: twitter;ratio:0.7"></a></li>
                <li><a class="tm-icon-gitter" href="#" target="_blank" uk-icon="icon: gitter;ratio:0.7"></a></li>
            </ul>
        </div>
        <div class="uk-navbar-right">
            <a class="uk-button uk-button-default uk-button-large tm-navbar-button">
                <span uk-icon="bolt"></span>Hemen Başla
            </a>
        </div>
    </nav>
</div>