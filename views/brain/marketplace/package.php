<?php $view->script('marketplace-pkg', 'brain:app/bundle/marketplace-pkg.js', 'vue') ?>

<section class="uk-grid" uk-grid>
    <div class="uk-width-expand@m">
        <h1 class="uk-h2 uk-margin-remove"><?= $package->title ?></h1>
        <ul class="tm-subnav uk-subnav uk-subnav-divider uk-margin-small-top">
            <li><span class="uk-text-capitalize"><?= $package->getAuthor() ?></span></li>
            <li><span class="uk-text-capitalize"><?= __('Version') ?> <?= $package->version ?></span></li>
        </ul>
    </div>
</section>
<article class="uk-grid" uk-grid>
    <div class="uk-width-expand@m">
        <div class="uk-margin">
            <?php
            $img = (object) $package->getImage();
            ?>
            <img data-src="<?= $view->url()->getStatic($img->src) ?>" alt="<?= $img->alt ?>" class="tm-marketplace-package-img" uk-img>
        </div>
        <?php if ($package->content) : ?>
            <div class="uk-margin">
                <h2><?= __('Description') ?></h2>
                <?= $package->content ?>
            </div>
        <?php endif ?>
        <?php if ($package->get('content.changelog')) : ?>
            <div class="uk-margin">
                <h2><?= __('Changelog') ?></h2>
                <?= $view->markdown($package->get('content.changelog')) ?>
            </div>
        <?php endif ?>
    </div>
    <div class="uk-width-medium@m">
        <div class="uk-margin">
            <a href="<?= $view->url('@marketplace/download', ['id' => $package->id]) ?>" class="uk-button uk-button-primary uk-button-large uk-width-expand"><?= __('Download') ?></a>
        </div>
        <ul class="uk-list uk-list-large uk-list-divider uk-text-muted uk-text-small">
            <li>
                <div class="uk-grid uk-child-width-1-2" uk-grid>
                    <div class="uk-text-left">
                        <?= __('Type') ?>
                    </div>
                    <div class="uk-text-right">
                        <?= $package->type == 'greencheap-extension'  ? __('Extension') : __('Theme') ?>
                    </div>
                </div>
            </li>
            <li>
                <div class="uk-grid uk-child-width-1-2" uk-grid>
                    <div class="uk-text-left">
                        <?= __('Author') ?>
                    </div>
                    <div class="uk-text-right">
                        <?= $package->getAuthor() ?>
                    </div>
                </div>
            </li>
            <li>
                <div class="uk-grid uk-child-width-1-2" uk-grid>
                    <div class="uk-text-left">
                        <?= __('Version') ?>
                    </div>
                    <div class="uk-text-right">
                        <?= $package->version ?>
                    </div>
                </div>
            </li>
            <li>
                <div class="uk-grid uk-child-width-1-2" uk-grid>
                    <div class="uk-text-left">
                        <?= __('Created') ?>
                    </div>
                    <div class="uk-text-right">
                        <time datetime="<?= $package->date->format(\DateTime::ATOM) ?>" v-cloak>{{ "<?= $package->date->format(\DateTime::ATOM) ?>" | date }}</time>
                    </div>
                </div>
            </li>
            <li>
                <div class="uk-grid uk-child-width-1-2" uk-grid>
                    <div class="uk-text-left">
                        <?= __('Last Update') ?>
                    </div>
                    <div class="uk-text-right">
                        <time datetime="<?= $package->modified->format(\DateTime::ATOM) ?>" v-cloak>{{ "<?= $package->modified->format(\DateTime::ATOM) ?>" | date }}</time>
                    </div>
                </div>
            </li>
            <?php if ($package->get('content.repository_url')) : ?>
                <li>
                    <div class="uk-grid" uk-grid>
                        <div class="uk-width-small uk-text-left">
                            <?= __('Repository') ?>
                        </div>
                        <div class="uk-width-expand uk-text-right uk-text-truncate">
                            <a class="uk-link-muted" href="<?= $package->get('content.repository_url') ?>" target="_blank"><?= $package->get('content.repository_url') ?></a>
                        </div>
                    </div>
                </li>
            <?php endif ?>
            <?php if ($package->get('content.support_url')) : ?>
                <li>
                    <div class="uk-grid" uk-grid>
                        <div class="uk-width-small uk-text-left">
                            <?= __('Support') ?>
                        </div>
                        <div class="uk-width-expand uk-text-right uk-text-truncate">
                            <a class="uk-link-muted" href="<?= $package->get('content.support_url') ?>" target="_blank"><?= $package->get('content.support_url') ?></a>
                        </div>
                    </div>
                </li>
            <?php endif ?>
        </ul>
        <?php if ($package->get('content.demo_url')) : ?>
            <a href="<?= $package->get('content.demo_url') ?>" target="_blank" class="uk-button uk-button-default uk-button-large uk-width-expand uk-margin"><?= __('Demo') ?></a>
        <?php endif ?>
    </div>
</article>