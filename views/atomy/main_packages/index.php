<div>
    <table class="uk-table">
        <thead>
            <tr>
                <th><?= __('Package Version') ?></th>
                <th class="uk-text-center"><?= __('Status') ?></th>
                <th><?= __('Released') ?></th>
                <th><?= __('PHP Version') ?></th>
            </tr>
        </thead>
        <tbody>
            <?php foreach($packages as $pkg): ?>
                <tr>
                    <?php 
                    $status = match($pkg->status){
                        1 => 'uk-text-warning',
                        2 => 'uk-text-success',
                        3 => 'uk-text-danger',
                        default => ''
                    }
                    ?>
                    <td><a href="<?= $pkg->getUrl() ?>"><?= sprintf('GreenCheap %s', $pkg->version) ?></a></td>
                    <td class="uk-text-center"><span class="<?= $status ?>"><?= $pkg->getStatus() ?></span></td>
                    <td><span><?= $pkg->date->format('d F Y') ?></span></td>
                    <td><span><?= $pkg->php_version ?></span></td>
                </tr>
            <?php endforeach; ?>
        </tbody>
    </table>

</div>
