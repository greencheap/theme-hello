<?php foreach($widgets as $widget): ?>
    <?php 
        $section = [
            $widget->theme['section'], $widget->theme['sectionSize'], $widget->theme['contentAlign']
        ];
        $image = null;
        if($widget->theme['sectionImage']){
            $section[] = 'uk-background-image uk-background-cover';
            $imageUrl = $view->url()->getStatic($widget->theme['sectionImage']);
            $image = "data-src='$imageUrl' uk-img";
        }

        $title = implode(' ', [$widget->theme['titleColor'], $widget->theme['titleClass']]);
    ?>
    <section class="<?= implode(' ', $section) ?>" <?= $image ?>>
        <div class="uk-container">
            <?php if(!$widget->theme['titleHide']): ?>
                <<?= $widget->theme['titleDomElement'] ?> class="<?= $title ?>"><?= $widget->title ?></<?= $widget->theme['titleDomElement'] ?>>
            <?php endif ?>
            <div><?= $widget->get('result') ?></div>
        </div>
    </section>
<?php endforeach ?>