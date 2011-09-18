
Scanner = function(poly) {
    // Partitioning
    var rays = [];
    var x1 = poly.extremes.x1;
    var y1 = poly.extremes.y1;
    var width = poly.width;
    var height = poly.height;

    // All of the following partitions MUST be succesful - we are after all restricting
    // our scanlines to the extreme bounds of the polygon.
    
    // bottom - handled seperately
    var l = poly.partition($L($V(x1-1, y1), $V(x1+width+1, y1))).cosame;
    if (l.length > 0) {
        rays.push(l);
    }
    
    // middle part - iterate through "inner" part of polygon
    for (var y = 1; y <= height-1; y++) {
        rays.push(poly.partition($L($V(x1-1, y+y1), $V(x1+width+1, y+y1))).neg);
    }
    
    //top - reverse it, because it is in the opposite direction than the scanline
    l = poly.partition($L($V(x1-1, y1+height), $V(x1+width+1, y1+height))).codiff;
    if (l.length > 0) {
        rays.push([$L(l[0].end, l[0].origin)]);
    }    
    return rays;
 }



Pixeler = function(viewport, data) {
    return function(x1,x2,y) {
/*
        console.log("viewport: " + viewport.x1 + "/" + viewport.y1 + "  x   " + viewport.x2 + "/" + viewport.y2);
        console.log("y: " + y + " ---- " + (viewport.y2 - (y)));
*/
        var si1 = (x1 - viewport.x1 + (viewport.y2 - (y)) * data.width)  * 4;
        var si2 = (x2 - viewport.x1 + (viewport.y2 - (y)) * data.width)  * 4;
        for (var x = si1; x  <= si2 + 3; x++) {
                data.data[x] = 255;
        }
    }
}

DrawScanlinesClosures = function(viewport, poly, rays) {
    
    var y1 = _.max([poly.extremes.y1, viewport.y1]); // this doesn't change
    var y2 = _.min([poly.extremes.y2, viewport.y2]); // this doesn't change

    var scans = [];
    
    // Nothing here changes, F can change...
    for (var y = y1; y <= y2; y++) {
        var line = [];
        if (rays[y-y1]) { // TODO: this is related to the "triangle bug"
            var scanLines = rays[y - y1];
            for (var i = 0; i < scanLines.length; i++) {
                var x1 =  Math.round(_.max([rays[y - y1][i].origin.x, viewport.x1]), 0)
                var x2 =  Math.round(_.min([rays[y - y1][i].end.x, viewport.x2]), 0);
                
                line.push([x1, x2]);
            }
        }
        scans.push(line);
    }
    
    return function (f) {
        for (var y = y1; y <= y2; y++) {
            var scan = scans[y-y1];
            for (var i = 0; i< scan.length;i++) {
                var x1 = scan[i][0]; var x2 = scan[i][1];
                
                f(x1, x2, y);
            }
        }
    }
}

DrawScanlinesNoClosures = function(viewport, poly, rays) {
    var y1 = _.max([poly.extremes.y1, viewport.y1]); // this doesn't change
    var y2 = _.min([poly.extremes.y2, viewport.y2]); // this doesn't change

    this.viewport = viewport;
    this.y1 = y1;
    this.y2 = y2;
    var scans = [];
    
    for (var y = y1; y <= y2; y++) {
        var lines = [];
        var ray = y - poly.extremes.y1;
        
        //console.log("y: " + y + " y1: " + y1 + " poly " + poly.extremes.y1 + " ray: " + ray);
        if (ray >= 0 && ray<rays.length) {
            //console.log("adding ray: " + ray);
            
            var scanLines = rays[ray];
            for (var i = 0; i < scanLines.length; i++) {
                var x1 =  Math.round(_.max([rays[ray][i].origin.x, viewport.x1]), 0)
                var x2 =  Math.round(_.min([rays[ray][i].end.x, viewport.x2]), 0);
                
                var si1 = (x1 - this.viewport.x1 + (this.viewport.y2 - (y)) * (this.viewport.width +1))  * 4;
                var si2 = (x2 - this.viewport.x1 + (this.viewport.y2 - (y)) * (this.viewport.width +1))  * 4;
                
                //console.log("adding ray from " + x1 + " to " + x2 + " on " + y);
                lines.push({screen: [si1, si2], world: [x1, x2] });
            }
        }
        scans.push({lines: lines, y: Math.abs(this.viewport.y2 - y)});
    }
    
    this.scans = scans;
    
}

DrawScanlinesNoClosures.prototype.draw = function(texture, data) {
    //console.log("draw: " + this.y1 + " - " + this.y2);
    for (var y = this.y1; y <= this.y2; y++) {
        //console.log("y: " + y);
        var lines = this.scans[y-this.y1].lines;
        
        for (var i = 0; i< lines.length;i++) {
            /*for (var a = x1; a <= x2  + 3; a++) {
                var tx = (Math.abs(lines[i].world[0]) *4 + z) % (texture.width * 4);
                var ty = this.scans[y-this.y1].y;
                var t = (texture.height-ty)*4*texture.width + tx;
                data.data[a] = texture.data[t];
                console.log("t: " + t + " tx: " + tx + " ty: " + ty + "      a: " + a + " world: " + lines[i].world[0] + " text: " + texture.width);
                
                //data.data[a] = 255;
                z++;
            }*/
            
            // x,y - coordinates on polygon
            // screenx,screeny - coordinates on screen buffer (the 0,0,width,height rect form view viewport)
            // tx,ty - texture coordinates for this pixel
            for (var x = lines[i].world[0]; x <= lines[i].world[1]; x++) {
                
                var screenx = x - this.viewport.x1;
                var screeny = this.viewport.y2 + (-1 * y);
                
                var tx = Math.abs(x) % texture.width;
                var ty = texture.height - (Math.abs(y) % texture.height) - 1;
                var t = (ty * texture.width + tx) *4;
                
                //console.log("pixel at " + screenx + " " + screeny + " " + this.viewport.x2);
                if (screenx >= 0 && screenx <= this.viewport.width && screeny >= 0 && screeny <= this.viewport.height) {
                    //console.log("DRAWING");
                    var a = (screeny * (this.viewport.width + 1))*4  + screenx * 4;
                    //console.log("X: " + x + " y: " + y + " ---- " + a);
                    
                    //var r = texture.data
                    data.data[a + 0] = texture.data[t + 0];
                    data.data[a + 1] = texture.data[t + 1];
                    data.data[a + 2] = texture.data[t + 2];
                    data.data[a + 3] = texture.data[t + 3];
                }
            }
        }
    }
}

ViewportNoClosures = function(sectors,x1,y1,x2,y2) {
    this.x1 = x1; this.x2 = x2;
    this.y1 = y1;  this.y2 = y2;
    this.width = x2 - x1;
    this.height = y2 - y1;

    this.sectors = sectors;
    this.drawers = [];
    for (var s = 0; s < this.sectors.length; s++) {
        var rays = Scanner(this.sectors[s].poly);
        this.drawers.push(new DrawScanlinesNoClosures(this,  this.sectors[s].poly, rays));
    }
    
}

ViewportNoClosures.prototype.cartesian2screenx = function(x) {
    return x - this.x1;
}
ViewportNoClosures.prototype.cartesian2screeny = function(y) {
    return this.y2 + (-1 * y);
}

ViewportNoClosures.prototype.singleBitmap = function (textures, data) {
    var v = "V: [" + this.x1 + "," + this.y1 + "] x [" + this.x2 + "," + this.y2 + "]";

    Timer.substart("NoClosures [" + v+ "]");
    for (var s = 0; s < this.drawers.length; s++) {
        this.drawers[s].draw(textures[s], data);
    }
    Timer.subend();
}

ViewportClosures = function(sectors,x1,y1,x2,y2) {
    this.x1 = x1; this.x2 = x2;
    this.y1 = y1;  this.y2 = y2;
    this.width = x2 - x1;
    this.height = y2 - y1;

    this.sectors = sectors;
    this.drawers = [];
    for (var s = 0; s < this.sectors.length; s++) {
        //var rays = Scanner(this.sectors[s].poly);
        this.drawers.push(new DrawScanlinesClosures(this,  this.sectors[s].poly, this.sectors[s].rays));
    }
}

ViewportClosures.prototype.cartesian2screenx = function(x) {
    return x - this.x1;
}
ViewportClosures.prototype.cartesian2screeny = function(y) {
    return this.y2 + (-1 * y);
}

ViewportClosures.prototype.singleBitmap = function (textures, data) {
    Timer.substart("Closures [" + this.drawers.length + "]");
    
    var pixeler = Pixeler(this, data);
    for (var s = 0; s < this.drawers.length; s++) {
        this.drawers[s](pixeler);
    }
    Timer.subend();
}


function drawPoly(viewport, ctx, label, poly, colour) {
    ctx.strokeStyle = colour;
    ctx.beginPath();
    for (var i = 0; i < poly.edges.length; i++) {
        ctx.moveTo(viewport.cartesian2screenx(poly.edges[i].origin.x), viewport.cartesian2screeny(poly.edges[i].origin.y));
        ctx.lineTo(viewport.cartesian2screenx(poly.edges[i].end.x), viewport.cartesian2screeny(poly.edges[i].end.y));
    }
    ctx.stroke();

    ctx.fillStyle = "rgba(220, 220, 220, 1)";
    ctx.font = "bold 12px sans-serif";
    var x = viewport.cartesian2screenx(poly.extremes.x1);
    var y = viewport.cartesian2screeny(poly.extremes.y1);

    ctx.fillText(label, x, y);

}



