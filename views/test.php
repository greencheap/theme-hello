<!DOCTYPE html>
<html class="<?= $params['html_class'] ?>" lang="<?= $intl->getLocaleTag() ?>">
    <head>
        <meta charset="utf-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <?= $view->render('head') ?>
        <?php $view->style('theme', 'theme:css/theme.css') ?>
        <?php $view->script('theme', 'theme:js/theme.js', ['uikit', 'uikit-icons']) ?>
        <?php $view->style('fpd-all-css' , 'easyeditor:assets/plugins/fancy-product-designer/css/FancyProductDesigner-all.min.css') ?>

        <?php $view->script('fpd-jquery' , 'https://cdnjs.cloudflare.com/ajax/libs/jquery/3.4.1/jquery.min.js') ?>
        <?php $view->script('fpd-jquery-ui' , 'https://cdnjs.cloudflare.com/ajax/libs/jqueryui/1.12.1/jquery-ui.min.js') ?>
        <?php $view->script('fpd-fabric' , 'easyeditor:assets/plugins/fancy-product-designer/js/fabric.min.js') ?>
        <?php $view->script('fpd-all-js' , 'easyeditor:assets/plugins/fancy-product-designer/js/FancyProductDesigner-all.min.js') ?>
        <script>
            $(document).ready(function(){
                var layer = '';
                var $fpd = $('#fpd'),
                pluginOpts = {
                    designsJSON: '<?= $view->url()->getStatic('easyeditor:json/hello.html') ?>',
                    productsJSON: {
                        "shirts": {
                            "name": "T-Shirts",
                            "purchase_url": "https://elopage.com/s/radykal/fancy-product-designer-t-shirts-templates/payment",
                            "templates": [
                                {
                                    "name": "T-Shirt Men Standard",
                                    "images": [
                                        "/assets/img/product-templates/shirts_men_standard_front.png",
                                        "/assets/img/product-templates/shirts_men_standard_back.png"
                                    ],
                                    "free": true,
                                    "file": "shirts_men_standard.zip"
                                }
                            ]
                        }
                    },
                    langJSON: {"toolbar":{"fill":"Fill","font_family_search":"Search Fonts","transform":"Transform","position":"Position","move_up":"Move Up","move_down":"Move Down","reset":"Reset","font_size":"Font Size","line_height":"Line Height","bold":"Bold","italic":"Italic","underline":"Underline","text_align":"Text Alignment","stroke":"Stroke","stroke_width":"Stroke Width","curved_text":"Curved Text","edit_text":"Edit Text","color":"Color","patterns":"Patterns","transparency":"Transparency","align_left":"Align Left","align_top":"Align Top","align_right":"Align Right","align_bottom":"Align Bottom","center_h":"Center Horizontal","center_v":"Center Vertical","flip_h":"Flip Horizontal","flip_v":"Flip Vertical","curved_text_switch":"Switch","curved_text_reverse":"Reverse","radius":"Radius","spacing":"Spacing","letter_spacing":"Letter Spacing","advanced_editing":"Advanced Editing","text_transform":"Text Transform","back":"Back","shadow":"Shadow","shadow_blur":"Blur","shadow_offset_x":"Offset X","shadow_offset_y":"Offset Y"},"actions":{"reset_product":"Reset","zoom":"Zoom","magnify_glass":"Magnify Glass","download":"Download","download_current_view":"Only export current showing view","info":"Info","info_content":"You can set the info text in the Fancy Product Designer Labels settings.","print":"Print","save":"Save","load":"Load","manage_layers":"Manage Layers","qr_code":"Add QR-Code","qr_code_input":"Enter a URL, some text...","qr_code_add_btn":"Add QR-Code","undo":"Undo","redo":"Redo","snap":"Center Snap","preview_lightbox":"Preview","save_placeholder":"Optional: Enter a title","ruler":"Toggle Ruler","previous_view":"Previous View","next_view":"Next View","start_guided_tour":"Start Guided Tour","load_designs_empty":"No Designs saved yet!"},"modules":{"products":"Swap Product","products_confirm_replacement":"Are you sure to replace the product?","products_confirm_button":"Yes, please!","images":"Add Image","upload_zone":"Click or drop images here","facebook_select_album":"Select An Album","text":"Add Text","text_input_placeholder":"Enter some text","enter_textbox_width":"Optional: Enter a fixed width","text_add_btn":"Add Text","designs":"Choose From Designs","designs_search_in":"Search in","manage_layers":"Manage Layers","images_agreement":"I have the rights to use the images.","images_confirm_button":"Confirm","images_pdf_upload_info":"Creating images from PDF...","pixabay_search":"Search in Pixabay library","depositphotos_search":"Search in depositphotos.com","depositphotos_search_category":"Search In ","text_Layers":"Text Layers","text_layers_clear":"Clear","layouts":"Layouts","layouts_confirm_replacement":"Are you sure to replace all elements in the current view?","layouts_confirm_button":"Yes, got it!"},"image_editor":{"mask":"Mask","filters":"Filters","color_manipulation":"Color Manipulation","custom_cropping":"Custom Cropping","filter_none":"None","brightness":"Brightness","contrast":"Contrast","remove_white":"Remove White","remove_white_distance":"Distance","restore":"Restore Original","save":"Save"},"misc":{"initializing":"Initializing Product Designer","out_of_bounding_box":"Move element in its containment!","product_saved":"Product Saved!","loading_image":"Loading Image...","uploaded_image_size_alert":"Sorry! But the uploaded image size does not conform our indication of size.<br \/>Minimum Width: %minW pixels<br \/>Minimum Height: %minH pixels<br \/>Maximum Width: %maxW pixels<br \/>Maximum Height: %maxH pixels","modal_done":"Done","minimum_dpi_info":"The JPEG image does not have the required DPI of %dpi.","maximum_size_info":"The image %filename exceeds the maximum file size of %mbMB.","customization_button":"Customize","shortcode_order:success_sent":"The order has been successfully sent to the site owner!","shortcode_order:fail_sent":"The order could not be sent. Please try again or contact the site owner!","not_supported_device_info":"Sorry! But the product designer can not be displayed on your device. Please use a device with a larger screen!","share:_button":"Share Design","share:_process":"An unique URL to share will be created for you...","share:_default_text":"Check out my design!","customization_required_info":"You need to customize the default design!","image_added":"Image Added!","reset_confirm":"Are you sure to reset everything?","popup_blocker_alert":"Please disable your pop-up blocker and try again.","shortcode_form:send":"Send","shortcode_form:name_placeholder":"Enter your name here","shortcode_form:email_placeholder":"Enter your email here","login_required_info":"You need to be logged in to upload images!","view_optional_unlock":"Unlock view","account_storage:login_required":"Please log into your account!","account_storage:products_loaded":"Saved Products Loaded.","account_storage:saved_products":"My Saved Products","guided_tour_back":"Back","guided_tour_next":"Next","automated_export:download":"Get Print-Ready File","shortcode_order:_success_sent":"The order has been successfully sent to the site owner!","shortcode_order:_fail_sent":"The order could not be sent. Please try again or contact the site owner!"},"plus":{"names_numbers":"Names & Numbers","names_numbers_add_new":"Add New","drawing":"Free Drawing","drawing_brush_type":"Brush Type","drawing_pencil":"Pencil","drawing_circle":"Circle","drawing_spray":"Spray","drawing_color":"Color","drawing_line_width":"Line Width","drawing_draw_here":"Draw Here","drawing_clear":"Clear","drawing_add":"Add","bulk_add_variations_title":"Bulk Order","bulk_add_variations_add":"Add","bulk_add_variations_term":"Please set all variations in the Bulk Order panel correctly!","dynamic_views":"Manage Views","dynamic_views_add_view_info":"Add new view","dynamic_views_add_blank":"Blank","dynamic_views_add_from_layouts":"From Layouts"},"woocommerce":{"catalog:_add_to_cart":"Customize","cart:_re-edit product":"Click here to re-edit","get_a_quote":"Get a quote","order:_view_customized_product":"View Product","save_order":"Save Order","saving_order":"Saving Order","order_saved":"Order Saved","order_saving_failed":"Saving Order Failed. Please try again!","loading_product":"Loading product...","product_loading_fail":"Product could not be loaded. Please try again!","cross_sells:headline":"Try your design on another product","add_to_cart":"The product will be added into the cart."}},
                    stageWidth: 1200, 
                    stageHeight: 800,
                    editorMode: false,
                    hideDialogOnAdd:true,
                    allowedImageTypes:['jpg','png','jpeg'],
                    pixabayHighResImages:true,
                    customTextParameters: {
                        colors: false,
                        removable: true,
                        resizable: true,
                        draggable: true,
                        rotatable: true,
                        autoCenter:true,
                        zChangeable:true,
                        topped: true,
                    },
                    customImageParameters: {
                        draggable: true,
                        removable: true,
                        resizable: true,
                        rotatable: true,
                        colors: '#000',
                        autoCenter:true,
                        topped: layer,
                        zChangeable:true,
                        minW:10,
                        minH:10,
                        maxW:100000,
                        maxH:100000,
                        resizeToH:150,
                        resizeToW:150,
                        maxSize:100,
                        minDPI:1,
                        minScaleLimit:0.10
                    },
                    actions:  {
                        'top': [],
                        'right': [],
                        'bottom': ['undo','redo'],
                        'left': []
                    }
                };

                var yourDesigner = new FancyProductDesigner($fpd , pluginOpts);
                //you can listen to events
                $fpd.on('productCreate', function() {
                    yourDesigner.print()
                });
            });
        </script>
    </head>
    <body>
        <div id="fpd"></div>

        <?= $view->render('footer') ?>
    </body>
</html>
