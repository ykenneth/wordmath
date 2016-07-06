var CanvasDrawr = function(options) {
    var canvas = document.getElementById(options.id), ctxt = canvas.getContext("2d");
    var draw_mode = document.getElementById("draw_mode");

    canvas.style.width ='100%';
    canvas.style.height='100%';
    // ...then set the internal size to match
    canvas.width  = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;

    ctxt.lineWidth = options.size || Math.ceil(Math.random() * 35);
    ctxt.lineCap = options.lineCap || "round";
    ctxt.pX = undefined;
    ctxt.pY = undefined;
    var lines = [, , ];
    var offset = $(canvas).offset();
    var self = {
        init: function() {
            canvas.addEventListener('touchstart', self.ontouchstart, false);
            canvas.addEventListener('touchmove', self.ontouchmove, false);
            canvas.addEventListener('touchend', self.finish_move, false);


            canvas.addEventListener('mousedown', self.onmousedown, false);
            canvas.addEventListener('mousemove', self.onmousemove, false);
            canvas.addEventListener('mouseup', self.finish_move, false);

            cursor_mode.addEventListener('click',self.change_cursor_mode,false);
            draw_mode.addEventListener('click',self.change_draw_mode,false);
            erase_mode.addEventListener('click',self.change_erase_mode,false);
            self.draw_m = 0;
            self.object_offset_x = 5; //TODO: take from constant
            self.object_offset_y = 10; //TODO: take from constant
	        self.saved_lines = [];
	        self.line_count = 0;
            self.object_stack = [];
            self.selected_images = -1;
            self.cur_draw = false;
        },
        ontouchstart: function(event) {
            $.each(event.touches, function(i, touch) {
                self.preDraw(this,touch.identifier)
            });
            event.preventDefault();
        },
        ontouchmove: function(event) {
            $.each(event.touches, function(i, touch) {
                self.draw(this,touch.identifier)
            });
            event.preventDefault();
        },
        onmousedown: function(event) {
            self.preDraw(event,999);
            event.preventDefault();
        },
        onmousemove: function(event) {
            self.draw(event,999);
            event.preventDefault();
        },
        preDraw: function(event,id) {
            mycolor = "yellow";
            self.cur_draw = true;
            if (self.draw_m == 1)
            {
              mycolor = "black";
            }
            else if (self.draw_m == 2)
            {
              mycolor = "white"
            }
            lines[id] = {
                    x: event.pageX - offset.left,
                    y: event.pageY - offset.top,
                    color: mycolor,
                    id: id
                };
            if(self.draw_m == 0) {
                if(self.selected_images == -1){
                    self.mov_image = find_image(self.object_stack,event.pageX - offset.left,event.pageY - offset.top);
                    if(self.mov_image == -1 ){
                        self.start_sel_pos = {x:event.pageX - offset.left, y:event.pageY - offset.top};
                        self.end_sel_pos = {x:event.pageX - offset.left, y:event.pageY - offset.top};
                    }
                    else {
                        self.start_sel_pos = -1;
                        self.end_sel_pos = -1;
                    }

                }
                else {
                    self.mov_image = -1;

                    if (lines[id].x < self.start_sel_pos.x || lines[id].x > self.end_sel_pos.x
                        || lines[id].y < self.start_sel_pos.y || lines[id].y > self.end_sel_pos.y ){
                        for (var idx in self.selected_images)
                        {
                            self.selected_images[idx].selected = false;
                        }

                        self.selected_images = -1;
                        self.start_sel_pos = -1;
                        self.end_sel_pos = -1;
                    }
                }
            }
            else {
                self.mov_image = -1;
                self.start_sel_pos = -1;
                self.end_sel_pos = -1;

                self.saved_lines[self.line_count] = [];
                self.saved_lines[self.line_count].push({x:lines[id].x, y:lines[id].y, color:lines[id].color, id:lines[id].id});
                self.line_count = self.line_count + 1;
            }
        },
        draw: function(event,id) {
          if(!lines[id])
            return;
          if(!self.cur_draw)
            return;
          var moveX = event.pageX - offset.left - lines[id].x, moveY = event.pageY - offset.top - lines[id].y;
          if (event.pageX - offset.left > canvas.scrollWidth || event.pageY - offset.top > canvas.scrollHeight
              || event.pageX < offset.left || event.pageY < offset.top) {
              moveX = 0;
              moveY = 0;
          }
          var ret = self.move(id, moveX, moveY);
          lines[id].x = ret.x;
          lines[id].y = ret.y;
          if (self.draw_m > 0) {
              for (idx = self.line_count - 1; idx >= 0; idx--) {
                  if (self.saved_lines[idx][0]['id'] == id) {
                      var width = 10;
                      if (self.draw_m == 1)
                          width = 5;
                      if (self.draw_m == 2)
                          width = 40;
                      self.saved_lines[idx].push({
                          x: lines[id].x,
                          y: lines[id].y,
                          color: lines[id].color,
                          id: lines[id].id,
                          width: width
                      });
                      break;
                  }
              }
            }
          self.redraw_all();
        },
        finish_move: function(event)
        {
            self.cur_draw = false;
            if(self.selected_images == -1 && self.start_sel_pos != -1)
            {
                var min_x = Math.min(self.start_sel_pos.x,self.end_sel_pos.x);
                var max_x = Math.max(self.start_sel_pos.x,self.end_sel_pos.x);
                var min_y = Math.min(self.start_sel_pos.y,self.end_sel_pos.y);
                var max_y = Math.max(self.start_sel_pos.y,self.end_sel_pos.y);

                self.start_sel_pos.x = min_x;
                self.start_sel_pos.y = min_y;
                self.end_sel_pos.x = max_x;
                self.end_sel_pos.y = max_y;

                self.selected_images = find_images_in_range(self.object_stack,min_x,max_x,min_y,max_y);
                for (var idx in self.selected_images)
                {
                    self.selected_images[idx].selected = true;
                }
                if(self.selected_images == -1)
                {
                    self.start_sel_pos = -1;
                    self.end_sel_pos = -1;
                }
            }
            else if(self.selected_images != -1)
            {
                for (var idx in self.selected_images)
                {
                    self.selected_images[idx].selected = false;
                }
                self.selected_images = -1;
                self.end_sel_pos = -1;
                self.start_sel_pos = -1;
                self.redraw_all();
            }

            self.mov_image = -1;
        },
        move: function(i, changeX, changeY) {
            if(self.selected_images != -1)
            {
                var out_of_bounds = false;
                for(var idx in self.selected_images) {
                    var newX = self.selected_images[idx]['x'] + changeX;
                    var newY = self.selected_images[idx]['y'] + changeY;

                    if(newX  < 0 || newY < 0
                       || newX + self.selected_images[idx]['image'].width > canvas.scrollWidth
                       || newY + self.selected_images[idx]['image'].height > canvas.scrollHeight)
                        out_of_bounds = true;
                }
                if(!out_of_bounds)
                    for(var idx in self.selected_images)
                    {
                        var newX = self.selected_images[idx]['x'] + changeX;
                        var newY = self.selected_images[idx]['y'] + changeY;
                        self.selected_images[idx]['x'] = newX;
                        self.selected_images[idx]['y'] = newY;
                    }
            }
            if(self.mov_image != -1)
            {
                var newX = self.mov_image['x'] + changeX;
                var newY = self.mov_image['y'] + changeY;
                self.mov_image['x'] = newX;
                self.mov_image['y'] = newY;
                if(self.mov_image['x']  < 0 )
                    self.mov_image['x'] = 0;
                if(self.mov_image['y'] < 0)
                    self.mov_image['y'] = 0;
                if (self.mov_image['x'] + self.mov_image['image'].width > canvas.scrollWidth)
                    self.mov_image['x'] = canvas.scrollWidth - self.mov_image['image'].width;
                if (self.mov_image['y'] + self.mov_image['image'].height > canvas.scrollHeight)
                    self.mov_image['y'] = canvas.scrollHeight - self.mov_image['image'].height;
            }
            if(self.end_sel_pos != -1 && self.selected_images == -1)
                self.end_sel_pos = self.end_sel_pos = {x:lines[i].x + changeX, y:lines[i].y + changeY};

            return {
                x: lines[i].x + changeX,
                y: lines[i].y + changeY
            };
        },
        change_draw_mode: function() {
            self.draw_m = 1;
        },
        change_erase_mode: function() {
            self.draw_m = 2;
        },
        change_cursor_mode: function() {
            self.draw_m = 0;
        },
        draw_picture : function(image_name,reps,layer) {
            image_cur = new Image();
            image_cur.src = "pictures/" + image_name;
	    for (i = 0; i < reps; i++) {
		y = self.object_offset_y;
		x = self.object_offset_x;
		ctxt.drawImage(image_cur,x,y);
		self.object_offset_x += image_cur.width + 10;
		if (self.object_offset_x + image_cur.width > canvas.scrollWidth)
		{
		    self.object_offset_x = 5; //TODO use constant
		    self.object_offset_y = self.object_offset_y + image_cur.height + 10

		}
		if (self.object_offset_y + image_cur.height > canvas.scrollHeight)
		{
		    self.object_offset_x = 5; //TODO use constant
		    self.object_offset_y = 10 //TODO: take from constant

		}
		self.object_stack.push(make_pic({image: image_cur, x:x, y:y, name:image_name, layer:layer, selected:false}));
	    }
        },
        remove_picture : function(image_name,reps) {
	        for (i = self.object_stack.length-1; i >= 0; i--) {
		    if(self.object_stack[i]['name'] == image_name) {
		        self.object_stack.splice(i,1);
		        reps--;
		    }
		    if(reps == 0)
		        break;
	        }
	        self.redraw_all();
        },
	redraw_all : function () {
        ctxt.clearRect(0, 0, canvas.width, canvas.height);

        if(self.end_sel_pos != -1 && self.selected_images == -1)
        {
            var width = self.end_sel_pos.x - self.start_sel_pos.x;
            var height = self.end_sel_pos.y -  self.start_sel_pos.y;
            ctxt.fillStyle = 'blue';

            ctxt.fillRect(self.start_sel_pos.x,self.start_sel_pos.y,width,height);
        }
        for(var idx in self.saved_lines) {
            var line_path = self.saved_lines[idx];
            for(line_idx = 0; line_idx < line_path.length-1; line_idx++)
            {
                ctxt.strokeStyle = line_path[line_idx].color;
                ctxt.beginPath();
                ctxt.lineWidth = line_path[line_idx+1].width;
                ctxt.moveTo(line_path[line_idx].x, line_path[line_idx].y);
                ctxt.lineTo(line_path[line_idx+1].x, line_path[line_idx+1].y);
                ctxt.stroke();
                ctxt.closePath();

            }

	    }

	    for(layer = 1; layer < 5; layer ++) {
		for(var index in self.object_stack)
		{
		    if(self.object_stack[index]['layer'] == layer) {
			    ctxt.drawImage(self.object_stack[index]['image'],self.object_stack[index]['x'],self.object_stack[index]['y']);
                if(self.object_stack[index]['selected'] == true)
                {

                    ctxt.beginPath();

                    ctxt.lineWidth = 5;
                    ctxt.strokeStyle = 'yellow';
                    ctxt.rect(self.object_stack[index]['x'], self.object_stack[index]['y'],
                                self.object_stack[index]['image']['width'], self.object_stack[index]['image']['height']);
                    ctxt.stroke();
                    ctxt.closePath();
                }
		    }
		}
	    }
	},
	clear : function() {
	    ctxt.clearRect(0, 0, canvas.width, canvas.height);
	    self.object_offset_x = 5; //TODO use a constant
	    self.object_offset_y = 10;
	    self.object_stack = [];
	    self.saved_lines = [];
	    self.line_count = 0;
	    self.draw_m = 0;
	},
	set_offset : function() {
	    offset = $(canvas).offset();
        canvas.style.width ='100%';
        canvas.style.height='100%';
        // ...then set the internal size to match
        canvas.width  = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

    }
    };
    self.init();
    return self;
};

function make_pic(args){
    a = [];
    a['layer'] = args['layer'];
    a['name'] = args['name'];
    a['image'] = args['image'];
    a['x'] = args['x'];
    a['y'] = args['y'];
    a['selected'] = args['selected'];
    return a;
}

function find_images_in_range(array,x_start,x_end,y_start,y_end)
{
    var images = [];
    for(var index in array)
    {
        if(x_end > array[index]['x'] && x_start < array[index]['x'] + array[index]['image'].width)
        {
            if(y_end > array[index]['y'] && y_start < array[index]['y'] + array[index]['image'].height)
            {
                images.push(array[index])
            }
        }
    }
    if(images.length > 0)
        return images;
    return -1;
}

function find_image(array,x,y)
{
  for(var index in array)
  {
    if(x > array[index]['x'] && x < array[index]['x'] + array[index]['image'].width)
    {
      if(y > array[index]['y'] && y < array[index]['y'] + array[index]['image'].height)
      {
        return array[index];
      }
    }
  }
  return -1;
}
