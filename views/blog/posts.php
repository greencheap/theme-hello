<?php $view->script('posts', 'blog:app/bundle/post.js', 'vue') ?>

<?php foreach ($posts as $post) : ?>
    <article class="uk-margin-large-bottom">
        <div class="uk-flex uk-flex-middle uk-flex-center">
            <div class="uk-width-xlarge@s uk-text-center">
                <span class="uk-text-muted uk-display-block"><?= __('%date%', ['%date%' => '<time datetime="'.$post->date->format(\DateTime::ATOM).'" v-cloak>{{ "'.$post->date->format(\DateTime::ATOM).'" | date("longDate") }}</time>' ]) ?></span>
                <h2 class="uk-h1"><a class="uk-link-text" href="<?= $view->url('@blog/id', ['id' => $post->id]) ?>"><?= $post->title ?></a></h2>
                <p><?= $post->excerpt ?: $post->content ?></p>
                <div class="uk-flex uk-flex-center">
                    <ul class="uk-subnav uk-subnav-pill">
                        <?php foreach($post->getCategories() as $category): ?>
                            <li><a class="uk-text-capitalize" href="<?= $view->url('@blog/category/id' , ['id' => $category['id']]) ?>"><?= $category['title'] ?></a></li>
                        <?php endforeach ?>
                    </ul>
                </div>
            </div>
        </div>
        <?php if ($image = $post->get('image.src')): ?>
            <div class="uk-margin">
                <a class="uk-display-block" href="<?= $view->url('@blog/id', ['id' => $post->id]) ?>"><img class="tm-blog-image" src="<?= $image ?>" alt="<?= $post->get('image.alt') ?>"></a>
            </div>
        <?php endif ?>
    </article>
<?php endforeach ?>

<?php

$range     = 3;
$total     = intval($total);
$page      = intval($page);
$pageIndex = $page - 1;

?>

<?php if ($total > 1) : ?>
    <ul class="uk-pagination uk-flex-center">

        <?php for($i=1;$i<=$total;$i++): ?>
            <?php if ($i <= ($pageIndex+$range) && $i >= ($pageIndex-$range)): ?>

                <?php if ($i == $page): ?>
                    <li class="uk-active"><span><?=$i?></span></li>
                <?php else: ?>
                    <li>
                        <a href="<?= $view->url($page_link, array_merge(['page' => $i], $page_params)) ?>"><?=$i?></a>
                    </li>
                <?php endif; ?>

            <?php elseif($i==1): ?>

                <li>
                    <a href="<?= $view->url($page_link, array_merge(['page' => 1], $page_params)) ?>">1</a>
                </li>
                <li><span>...</span></li>

            <?php elseif($i==$total): ?>

                <li><span>...</span></li>
                <li>
                    <a href="<?= $view->url($page_link, array_merge(['page' => $total], $page_params)) ?>"><?=$total?></a>
                </li>

            <?php endif; ?>
        <?php endfor; ?>


    </ul>
<?php endif ?>
