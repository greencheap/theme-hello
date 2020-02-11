<?php 
namespace Nexis\EasyEditor\Controller;

use Nexis\Application as App;
use Symfony\Component\HttpFoundation\Response;
/**
 * 
 */
class TestController{

    public $response;

    public function __contructor(){
        $this->response = new Response();
    }

    /**
     * @Route("/")
     */
    public function indexAction(){
        return new Response(App::view('easyeditor:views/test.php'));
    }

}
?>