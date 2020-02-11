<?php
return [
    'enable' => function ($app) {
        $util = $app['db']->getUtility();
        // @easyeditor_model

        // @easyeditor_items
        if( !$util->tableExists('@easyeditor_model') ){
            $util->createTable('@easyeditor_model' , function($table){
                $table->addColumn('id' , 'integer' , ['autoincrement' => true , 'unsigned' => true , 'length' => 10]);
                $table->addColumn('user_id' , 'integer');
                $table->addColumn('title' , 'string');
                $table->addColumn('slug' , 'string' , ['notnull' => false]);
                $table->addColumn('status' , 'integer');
                $table->addColumn('roles' , 'simple_array' , ['notnull' => false]);
                $table->addColumn('date' , 'datetime');
                $table->addColumn('data' , 'json_array' , ['notnull' => false]);
                $table->setPrimaryKey(['id']);
                $table->addIndex(['title'], '@EASYEDITOR_MODEL_TITLE');
                $table->addIndex(['user_id'], '@EASYEDITOR_MODEL_USER_ID');
                $table->addIndex(['product_id'], '@EASYEDITOR_MODEL_PRODUCT_ID');
            });
        }

        if( !$util->tableExists('@easyeditor_items') ){
            $util->createTable('@easyeditor_items' , function($table){
                $table->addColumn('id' , 'integer' , ['autoincrement' => true , 'unsigned' => true , 'length' => 10]);
                $table->addColumn('model_id' , 'integer');
                $table->addColumn('status' , 'integer');
                $table->addColumn('user_id' , 'integer');
                $table->addColumn('date' , 'datetime');
                $table->addColumn('data' , 'json_array' , ['notnull' => false]);
                $table->setPrimaryKey(['id']);
            });
        }
    },
    'disable' => function ($app) {
        $util = $app['db']->getUtility();
    },
    'updates' => []
];
