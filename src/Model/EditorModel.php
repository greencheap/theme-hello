<?php
namespace GreenCheap\EasyEditor\Model;

use GreenCheap\Database\ORM\ModelTrait;
use GreenCheap\System\Model\DataModelTrait;
use GreenCheap\User\Model\AccessModelTrait;

/**
 * @Entity(tableClass="@easyeditor_model")
 */
class EditorModel implements \JsonSerializable
{
    use ModelTrait , DataModelTrait , AccessModelTrait;

    const STATUS_TRASH     = 0;
    const STATUS_DRAFT     = 1;
    const STATUS_PUBLISHED = 2;

    /**
     * @Column(type="integer")
     * @Id
     */
    public $id;

    /**
     * @Column(type="integer")
     */
    public $user_id;

    /**
     * @Column(type="string")
     */
    public $title;

    /**
     * @Column(type="string")
     */
    public $slug;

    /**
     * @Column(type="integer")
     */
    public $status;

    /**
     * @Column(type="datetime")
     */
    public $date;
    
    /**
     * @var array
     */
    protected static $properties = [
        'published' => 'isPublished',
        'accessible' => 'isAccessible'
    ];

    /**
     * @return array
     */
    public function getStatuses(): array
    {
        return [
            self:: STATUS_TRASH => __('Trash'),
            self:: STATUS_DRAFT => __('Draft'),
            self:: STATUS_PUBLISHED => __('Published')
        ];
    }

    /**
     * @return bool
     * @throws \Exception
     */
    public function isPublished()
    {
        return $this->status == self::STATUS_PUBLISHED && $this->date < new \DateTime;
    }

    /**
     * @param User|null $user
     * @return bool
     * @throws \Exception
     */
    public function isAccessible(User $user = null)
    {
        return $this->isPublished() && $this->hasAccess($user ?: App::user());
    }

    /**
     * {@inheritdoc}
     */
    public function JsonSerializable(){
        return $this->toArray();
    }
}
