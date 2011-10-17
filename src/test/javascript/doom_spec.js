describe("The doom game library", function() {
    
    it("should be able to convert doom sub-sectors into polygons for drawing", function () {
        var polygons = null;
        
        runs(function() {
            $.getJSON("src/test/javascript/hole.json", function(data) {
                polygons = doom.get_polygons(data);
            });
        });
        
        waitsFor(function() { return polygons != null; });
        
        runs(function() {
            expect(polygons.length).toBe(4);
        });
    });
   
});