<?php 
    $title = implode(' ', [$params['titleColor'], $params['titleClass']]); 
?>
<?php if(!$params['titleHide']): ?>
    <<?= $params['titleDomElement'] ?> class="<?= $title ?>"><?= $page->title ?></<?= $params['titleDomElement'] ?>>
<?php endif ?>
<div><?= $page->content ?></div>