<?php $view->script('jquery', 'https://code.jquery.com/jquery-3.5.1.min.js') ?>
<script>
    (function($) {
        $(function() {
            $('#js-download').click(function() {
                setTimeout(function(){
                    $('body').append("<iframe src='<?= $view->url('@api/atomy/main_packages/download/id', ['id' => $pkg->id])  ?>' class='uk-hidden' width='0' height='0'>");
                }, 1000)
            });

        });
    })(jQuery);
</script>

<div id="modal-download" uk-modal>
    <div class="uk-modal-dialog ">
        <img data-src="<?= $view->url()->getStatic('atomy:assets/images/heading-image.jpg') ?>" width="100%" uk-img>
        <div class="uk-modal-body">
            <p class="uk-text-justify">
                <strong>GreenCheap</strong> is preparing to download. Your support is very important to us. If you didn't give a star to our project on Github, you can start it right now. Stars is very important to us. You can follow our social media accounts and if you have not yet registered on our site, you can register now.
            </p>
            <ul class="uk-nav uk-nav-default">
                <li><a href="<?= $view->url('@docs') ?>"><i uk-icon="file-text" class="uk-margin-small-right"></i>Documentation</a></li>
                <li><a href="https://github.com/greencheap/greencheap" target="_blank" ref="nofollow"><i uk-icon="github" class="uk-margin-small-right"></i>Github</a></li>
                <li><a href="https://twitter.com/greencheapnet" target="_blank" ref="nofollow"><i uk-icon="twitter" class="uk-margin-small-right"></i>Twitter</a></li>
                <li><a href="https://www.linkedin.com/company/greencheapnet/" target="_blank" ref="nofollow"><i uk-icon="linkedin" class="uk-margin-small-right"></i>Linkedin</a></li>
                <li><a href="https://discord.gg/AQhrxNyKCW" target="_blank" ref="nofollow"><i uk-icon="icon:discord;ratio:1.2" class="uk-margin-small-right"></i>Discord Community</a></li>
            </ul>
            <p class="uk-text-right">
                <button class="uk-button uk-button-default uk-modal-close" type="button">Close</button>
                <?php if ($app['user']->isAnonymous()): ?>
                    <a href="<?= $view->url('@user/registration') ?>" target="_blank" ref="nofollow" class="uk-button uk-button-primary" type="button">Sign up</a>
                <?php endif; ?>
            </p>
        </div>
    </div>
</div>

<div>
    <div class="uk-child-width-1-2@m" uk-grid>
        <div>
            <h1><?= sprintf('GreenCheap %s', $pkg->version) ?></h1>
        </div>
        <div class="uk-flex uk-flex-right">
            <ul class="uk-grid" uk-grid>
                 <?php 
                $status = match($pkg->status){
                    1 => 'uk-text-warning',
                    2 => 'uk-text-success',
                    3 => 'uk-text-danger',
                    default => ''
                }
                ?>
                <li>
                    <span class="uk-text-small uk-text-meta">Status:</span>
                    <p class="uk-margin-remove <?= $status ?>"><?= $pkg->getStatus() ?></p>
                </li>
                <li>
                    <span class="uk-text-small uk-text-meta">Released:</span>
                    <p class="uk-margin-remove"><?= $pkg->date->format('F Y') ?></p>
                </li>
                <li>
                    <span class="uk-text-small uk-text-meta">Php Version:</span>
                    <p class="uk-margin-remove"><?= $pkg->php_version ?></p>
                </li>
                <li>
                    <span class="uk-text-small uk-text-meta">Tag Code:</span>
                    <p class="uk-margin-remove"><a href="https://github.com/greencheap/greencheap/tree/<?= $pkg->version ?>" target="_blank" ref="nofollow">Github</a></p>
                </li>
            </ul>
        </div>
    </div>

    <ul uk-tab="connect:#content">
        <li><a href="#">New Features</a></li>
        <li><a href="#">Changelog</a></li>
        <li><a href="#">Comments</a></li>
    </ul>

    <div uk-grid>
        <div class="uk-width-expand@m">
            <ul id="content" class="uk-switcher uk-margin">
                <li><div><?= $pkg->content ?></div></li>
                <li><div><?= $pkg->changelog ?></div></li>
                <li>
                    <?= $view->render('atomy:views/main_packages/comment.php', [
                        'service' => [
                            'type' => 'main_packages',
                            'own_id' => $pkg->id,
                            'type_url' => [
                                'url' => '@main_packages/release/id',
                                'key' => 'id',
                            ]
                        ]
                    ]) ?>
                </li>
            </ul>
        </div>
        <div class="uk-width-large@m">
            <div class="uk-margin">
                <a href="#modal-download" uk-toggle id="js-download" class="uk-button uk-button-primary uk-button-large uk-width-expand"><?= sprintf('Download %s' , $pkg->version) ?></a>
            </div>

            <ul class="uk-subnav uk-subnav-pill uk-margin-top" uk-switcher="connect:#tab-content">
                <li><a href="#">Dependency</a></li>
                <li><a href="#">Dependency Dev</a></li>
            </ul>

            <ul id="tab-content" class="uk-switcher uk-margin">
                <li>
                    <ul class="uk-list uk-list-divider uk-list-small uk-text-small">
                        <?php foreach($pkg->get('composer_require') as $key => $addiction): ?>
                            <li><strong class="uk-margin-right"><?= $key ?>:</strong><span class="uk-float-right"><?= $addiction ?></span></li>
                        <?php endforeach ?>
                    </ul>
                </li>
                <li>
                    <ul class="uk-list uk-list-divider uk-list-small uk-text-small">
                        <?php foreach($pkg->get('composer_require_dev') as $key => $addiction): ?>
                            <li><strong class="uk-margin-right"><?= $key ?>:</strong><span class="uk-float-right"><?= $addiction ?></span></li>
                        <?php endforeach ?>
                    </ul>
                </li>
            </ul>

        </div>
    </div>
</div>
