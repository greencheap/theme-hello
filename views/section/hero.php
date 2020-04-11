<?php if($params['hero']['is_active']): ?>
    <div class="uk-position-relative <?= $params['hero']['section'] ?> <?= $params['hero']['flex'] ?> <?= $params['hero']['background']['src'] ? $params['hero']['background']['style']:'' ?>" data-src="<?= $params['hero']['background']['src'] ?>" <?= $params['hero']['background']['src'] ? 'uk-img':'' ?> uk-height-viewport>
        <?= $view->render('defined/navbar/default.php' , ['hero' => true , 'inverse' => $params['hero']['inverse']]) ?>
        <?= $params['hero']['content'] ?>
    </div>
<?php else: ?>
    <?= $view->render('defined/navbar/default.php') ?>
<?php endif ?>