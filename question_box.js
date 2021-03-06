var questions ;
var items;
var canvas;
var selected_items = [];
$(function () {
    
    $(document).ready(function() {
	canvas_win = new CanvasDrawr({id:"draw-canvas",size:15});
	$(window).trigger( "hashchange" );
    });

    $.ajax({
    	url: "questions.json",
    	async: false,
    	dataType: 'json',
    	success: function(data) {
			questions = data;
	    	generateAllQuestionsHTML(data);
    	}
    });

    $.ajax({
    	url: "items.json",
    	async: false,
    	dataType: 'json',
    	success: function(data) {
			items = data;
			generateAllItemsHTML(data);
    	}
    });

    $(window).on('hashchange', function(){
	// On every hash change the render function is called with the new hash.
	// This is how the navigation of our app happens.
	render(decodeURI(window.location.hash));
    });

    function generateAllItemsHTML(data){
	var list = $('.items-list');
	var theTemplateScript = $("#items-template").html();

	//Compile the template​
	var theTemplate = Handlebars.compile (theTemplateScript);
	list.append (theTemplate(data));
    }


    function generateAllQuestionsHTML(data){
		var list = $('.questions-list');
		var theTemplateScript = $("#questions-template").html();
		//Compile the template​
		var theTemplate = Handlebars.compile(theTemplateScript);
		list.append (theTemplate(data));
    }

    function render(url) {
  	// Get the keyword from the url.
	var temp = url.split('/')[0];
	
  	// Hide whatever page is currently shown.
	$('.main-content .page').hide();


	var map = {

  	    // The Homepage.
  	    '': function() {

  		renderHomePage();
  	    },

  	    // Single Question page.
  	    '#question': function() {
  		// Get the index of the question we want to show and call the appropriate function.
  		var index = url.split('#question/')[1].trim();
		var items_arr = index.split('/');
		var filters = "";
		try {
		    filters = JSON.parse(items_arr);
		}
		// If it isn't a valid json, go back to homepage ( the rest of the code won't be executed ).
		catch(err) {
		    window.location.hash = '#';
		}
  		renderSingleQuestionPage(index);
  	    },

  	    // Page with all items
  	    '#items': function() {
  		url = url.split('#items');
  		renderItemsPage();
  	    },
            // Page with all questions
        '#questions': function() {
                url = url.split('#questions');
                renderQuestionsPage();
            }


	};

	// Execute the needed function depending on the url keyword (stored in temp).
	if(map[temp]){
  	    map[temp]();
	}
	// If the keyword isn't listed in the above - render the error page.
	else {
  	    renderErrorPage();
	}
	// Show the page itself.
	// (the render function hides all pages so we need to show the one we want).
    }

    function renderHomePage(data){
	var page = $('.main-view');
	page.show();
    }
    
    function renderQuestionsPage(data){
        if (typeof canvas_win !== 'undefined') {
            canvas_win.clear();
            selected_items = [];
        }
        var page = $('.questions-view');
        page.show();
    }
    
    function renderItemsPage(data){
	    var page = $('.items-view');
	    page.show();
    }

    function renderSingleQuestionPage(index){
        var question_box = $('#question-content');

        question_box.text(questions[index-1]["content"]);
        var page = $('.single-question-view');
        var new_href = "#question/"+index;
        $("#items-back").attr("href","#question/"+index);
        var list = $('.choice-items-list');
        list.html("");
        var theTemplateScript = $("#choice-items-template").html();

        //Compile the template​
        var theTemplate = Handlebars.compile (theTemplateScript);

        data = [];
        for (var idx in selected_items)
        {
            data.push(items[selected_items[idx]]);
        }
        list.append (theTemplate(data));

        $('.plus_button').click(function(e)
                      {
                          id = $(e.target).attr("id").split("id-")[1];
                          var count = parseInt($(e.target).attr("count"));
                          canvas_win.draw_picture(items[id]["path"],count,items[id]["layer"]);
                          var newCount = parseInt($("#count-"+id).text()) + count;
                          $("#count-"+id).text(newCount);
                      });
        $('.min_button').click(function(e)
                      {
                          id = $(e.target).attr("id").split("id-")[1];
                          var count = parseInt($(e.target).attr("count"));
                          canvas_win.remove_picture(items[id]["path"],count);
                          var newCount = parseInt($("#count-"+id).text()) - count;
                          if (newCount < 0)
                            newCount = 0;
                          $("#count-"+id).text(newCount);
                      });
        page.show();
	    canvas_win.set_offset();
    }

    $('ul.items-list li').click(function(e) 
    {
        id = $(e.target).attr("id").split("item-")[1];
        $(e.target).toggleClass('selected');
        arr_idx = $.inArray(id,selected_items);
        if(arr_idx == -1)
        {
            selected_items.push(id);
        }
        else
        {
            selected_items.splice(arr_idx, 1);
        }
    });

});
