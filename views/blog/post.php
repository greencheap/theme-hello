<?php $view->script('post', 'blog:app/bundle/post.js', 'vue') ?>

<article class="uk-article">

    <div class="uk-flex uk-flex-middle uk-flex-center">
        <div class="uk-width-xlarge@s uk-text-center">
            <span class="uk-text-muted uk-display-block"><?= __('%date%', ['%date%' => '<time datetime="'.$post->date->format(\DateTime::ATOM).'" v-cloak>{{ "'.$post->date->format(\DateTime::ATOM).'" | date("longDate") }}</time>' ]) ?></span>
            <h2 class="uk-h1"><?= $post->title ?></h2>
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
            <img class="tm-blog-image" src="<?= $image ?>" alt="<?= $post->get('image.alt') ?>">
        </div>
    <?php endif ?>

    <div class="uk-flex uk-flex-center uk-margin-large">
        <div class="uk-width-2xlarge@m"><?= $post->content ?></div>
    </div>
    
    <div class="uk-flex uk-flex-center">
        <div class="uk-width-2xlarge@m">
            <?= $view->render('system/comment:views/comment.php', [
                'service' => [
                    'type' => 'blog',
                    'own_id' => $post->id,
                    'type_url' => [
                        'url' => '@blog/id',
                        'key' => 'id',
                    ]
                ]
            ]) ?>
        </div>
    </div>

</article>
