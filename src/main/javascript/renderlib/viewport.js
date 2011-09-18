
Viewport = function(sectors,x1,y1,x2,y2,data,ctx) {
    this.x1 = x1; this.x2 = x2;
    this.y1 = y1;  this.y2 = y2;
    this.width = x2 - x1;
    this.height = y2 - y1;
    this.data = data;
    this.ctx = ctx;
    
    this.sectors = sectors;
    this.drawers = [];
    for (var s = 0; s < this.sectors.length; s++) {
        var rays = Scanner(this.sectors[s].poly);
        this.drawers.push(new DrawScanlines(this,  this.sectors[s].poly, rays));
    }

}

Viewport.prototype.cartesian2screenx = function(x) {
    return x - this.x1;
}
Viewport.prototype.cartesian2screeny = function(y) {
    return this.y2 + (-1 * y);
}

Viewport.prototype.singleBitmap = function (textures, data) {
    var v = "V: [" + this.x1 + "," + this.y1 + "] x [" + this.x2 + "," + this.y2 + "]";

    Timer.substart("NoClosures [" + v+ "]");
    for (var s = 0; s < this.drawers.length; s++) {
        this.drawers[s].draw(textures[s], data);
    }
    Timer.subend();
}

Viewport.prototype.draw = function(textures) {
    
    Timer.start("Sectordraw");
    
    Timer.substart("clean");
    this.ctx.fillStyle   = '#000000'; 
    this.ctx.fillRect  (0,   0, ctx.canvas.width, ctx.canvas.height);
    Timer.subend();
    
    this.singleBitmap(textures, this.data);
    
    Timer.substart("Put image buffer");
    this.ctx.putImageData(this.data, 0, 0);
    Timer.subend();
    
    Timer.end();
    
    for (var i = 0; i < this.sectors.length; i++) {
        drawPoly(this, this.ctx, this.sectors[i].label, this.sectors[i].poly, "#0000ff");
    }
    
}

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


DrawScanlines = function(viewport, poly, rays) {
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

DrawScanlines.prototype.draw = function(texture, data) {
    for (var y = this.y1; y <= this.y2; y++) {
        var lines = this.scans[y-this.y1].lines;
        
        for (var i = 0; i< lines.length;i++) {
            // x,y - coordinates on polygon
            // screenx,screeny - coordinates on screen buffer (the 0,0,width,height rect form view viewport)
            // tx,ty - texture coordinates for this pixel
            for (var x = lines[i].world[0]; x <= lines[i].world[1]; x++) {
                
                var screenx = x - this.viewport.x1;
                var screeny = this.viewport.y2 + (-1 * y);
                
                if (screenx >= 0 && screenx <= this.viewport.width && screeny >= 0 && screeny <= this.viewport.height) {
                    //console.log("putting pixel " + screenx + " / " + screeny);
                    // get the texture coordinates
                    
                    // TODO: 4096 magic number
                    // I do this because when the polygons are in the negative x or y space
                    // the texture gets rendered inversely. So here I simply add 4096
                    // to the world coordinate to get everything into the first quadrant.
                    var tx = (x + 4096) % texture.width;   
                    var ty = texture.height - ((y + 4096) % texture.height) - 1;
                    var t = (ty * texture.width + tx) *4;
                    // index into screen buffer
                    var a = (screeny * (this.viewport.width + 1))*4  + screenx * 4;
                    //console.log("A: " + a + " T: " + t + " ty:" + ty + " y: " + Math.abs(y));
                    data.data[a + 0] = texture.imageData.data[t + 0];
                    data.data[a + 1] = texture.imageData.data[t + 1];
                    data.data[a + 2] = texture.imageData.data[t + 2];
                    data.data[a + 3] = texture.imageData.data[t + 3];
                }
            }
        }
    }
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



