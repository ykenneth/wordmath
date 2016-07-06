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
            canvas.addEventListener('touchstart', self.preDraw, false);
            canvas.addEventListener('touchmove', self.draw, false);
            canvas.addEventListener('touchend', self.finish_move, false);

            cursor_mode.addEventListener('click',self.change_cursor_mode,false);
            draw_mode.addEventListener('click',self.change_draw_mode,false);
            erase_mode.addEventListener('click',self.change_erase_mode,false);
            self.draw_m = 0;
            self.object_offset_x = 5;
            self.object_offset_y = 10;
	    self.saved_lines = [];
	    self.line_count = 0;
            self.object_stack = [];
        },
        preDraw: function(event) {
            $.each(event.touches, function(i, touch) {
                var id = touch.identifier, colors = ["red", "green", "yellow", "blue", "magenta", "orangered"], mycolor = colors[Math.floor(Math.random() * colors.length)];
                if (self.draw_m == 1)
                {
                  mycolor = "black";
                }
                else if (self.draw_m == 2)
                {
                  mycolor = "white"
                }
                if(self.draw_m == 0) {
                  self.mov_image = find_image(self.object_stack,this.pageX - offset.left,this.pageY - offset.top);
                }
                else {
                    self.mov_image = -1;
		    lines[id] = {
			x: this.pageX - offset.left,
			y: this.pageY - offset.top,
			color: mycolor,
			id: id
                    };
		    self.saved_lines[self.line_count] = [];
		    self.saved_lines[self.line_count].push(lines[id]);
		    self.line_count = self.line_count++;
                }
            });
            event.preventDefault();
        },
        draw: function(event) {
            var e = event, hmm = {};
            $.each(event.touches, function(i, touch) {
                var id = touch.identifier, moveX = this.pageX - offset.left - lines[id].x, moveY = this.pageY - offset.top - lines[id].y;
                var ret = self.move(id, moveX, moveY);
                lines[id].x = ret.x;
                lines[id].y = ret.y;
		for(var idx in self.saved_lines) {
		    if(self.saved_lines[idx][0][id]==id){
			self.saved_lines[idx].push(lines[id]);
			break;
		    }
		}
		self.redraw_all();
	    });
            event.preventDefault();
        },
        finish_move: function(event)
        {
          self.mov_image = -1;
        },
        move: function(i, changeX, changeY) {

	    if(self.mov_image != -1)
            {
              ctxt.fillStyle="white";
              ctxt.fillRect(self.mov_image['x']-5,self.mov_image['y']-5,
                            self.mov_image['image'].width+5,
                            self.mov_image['image'].height+5);
            }
	    
            if(self.mov_image != -1)
            {
              var newX = self.mov_image['x'] + changeX;
              var newY = self.mov_image['y'] + changeY;
              ctxt.drawImage(self.mov_image['image'],newX,newY);

              self.mov_image['x'] = newX;
              self.mov_image['y'] = newY;
            }
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
		    self.object_offset_y = 10
		    
		}
		self.object_stack.push(make_pic({image: image_cur, x:x, y:y, name:image_name, layer:layer}));
	    }
        },
        remove_picture : function(image_name,reps) {	    
	    for (i = self.object_stack.length-1; i >= 0; i--) {
		if(self.object_stack[i]['name'] == image_name) {
		    ctxt.fillStyle="white";
                    ctxt.fillRect(self.object_stack[i]['x']-5,self.object_stack[i]['y']-5,
				  self.object_stack[i]['image'].width+5,
				  self.object_stack[i]['image'].height+5);

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

	    for(var idx in self.saved_lines) {
		var line_path = self.saved_lines[idx];
		if(line_path.length > 2)
		    alert("length of line!  " + line_path.length)
		for(line_idx = 0; line_idx < line_path.length-1; line_idx++)
		{
		    ctxt.strokeStyle = line_path[line_idx].color;
		    ctxt.beginPath();
		    
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
		    }
		}
	    }
	},
	clear : function() {
	    ctxt.clearRect(0, 0, canvas.width, canvas.height);
	    self.object_offset_x = 5; //TODO use a constant
	    self.object_offset_y = 10;
	    self.object_stack = [];
	    self.draw_m = 0;
	},
	set_offset : function() {
	    offset = $(canvas).offset();
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
    return a;
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

