<?php 
namespace GreenCheap\EasyEditor\Controller\Admin;
use GreenCheap\Application as App;
use GreenCheap\EasyEditor\Model\EditorModel;
/**
 * @Access(admin=true)
 * @Route("index" , name="index")
 */
class ModelController {
    
    /**
     * @Route("/")
     */
    public function indexAction()
    {
        return 'Hello World';
    }

    /**
     * @Request({"id":"integer"})
     */
    public function editAction(int $id = 0)
    {
        if( !$query = EditorModel::where(compact('id'))->first() ){
            if($id){
                return App:: abort(404 , __('Not Found Item'));
            }
            $query = EditorModel::create([
                'user_id' => App::user()->id,
                'date'    => new \DateTime(),
                'status'  => EditorModel::STATUS_DRAFT
            ]);
        }

        return [
            '$view' => [
                'title' => $query->id ? __('Edit Model'):__('New Model'),
                'name'  => 'easyeditor:views/admin/editor-model/edit.php'
            ],
            '$data' => [
                'model' => $query
            ]
        ];
    }
}
?>
