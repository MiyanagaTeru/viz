function draw(targetDiv, filename) {
	d3.json('RoomCoordinates.json', function(data1) {
		d3.json("aisles.json", function(data2) {
			d3.json(filename, function(data3) {
				var roomCoordinates=data1;
				var aisles=data2;
				var records=data3.sort(function(a,b) { return parseFloat(b.movements) - parseFloat(a.movements) } );;

				for (var i=0;i<records.length;i++) {
					movement(targetDiv, records[i].source,records[i].target, records[i].movements, aisles, roomCoordinates);
				}

				var roomNodes = d3.select(targetDiv + " svg").selectAll(".rooms")
					.data(roomCoordinates)
					.enter()
					.append("g")
					.attr("class", "rooms");
				roomNodes.append("circle")
					.attr("cx", function(d) { return d.x*mapscale-87; })
					.attr("cy", function(d) { return d.y*mapscale; })
					.attr("r", 5)
					.attr("fill", "orange")
					.attr("class", "roomcircle")
					.attr("data-name",function(d){return d.name;})
					.attr("data-movement", function(d){return d.movements;})
					.on("mouseover", function() {
						var name = d3.select(this).attr("data-name");
						d3.select(this).transition().attr("r", 8).attr("fill", "#FF4F1F");
						d3.select(targetDiv + " svg").selectAll(".movement")
							.filter(function(d) {
								return d3.select(this).attr('data-source') === name || d3.select(this).attr('data-target') === name;
							})
							.style("stroke", "#FF4F1F")
							.style("opacity", 1);
					})
					.on("mouseout", function() {
						var name = d3.select(this).attr("data-name");
						d3.select(this)
							.transition()
							.attr("r", 5)
							.attr("fill", "orange");

						d3.select(targetDiv + " svg").selectAll(".movement")
							.filter(function(d) {
								return d3.select(this).attr('data-source') === name || d3.select(this).attr('data-target') === name;
							})
							.style("stroke", function() {
								var movementb = d3.select(this).attr("data-movement");
								if (movementb >= 8) {
									return "#285081";
								} else if (movementb >= 6) {
									return "#4A6491";
								} else if (movementb >= 4) {
									return "#447AA1";
								} else if (movementb >= 2) {
									return "#64A0E2";
								} else {
									return "#94C6F2";
								}
							});
					 });

				roomNodes.append("text")
					.attr("x", function(d) { return d.x*mapscale-87; })
					.attr("y", function(d) { return d.y*mapscale; })
					.text(function(d) { return d.name; })
					.style("font-size","10px");
			});
		});
	});
};

function inArray(needle, haystack) {
	var length = haystack.length;
	for(var i = 0; i < length; i++) {
		if(haystack[i] == needle) return true;
	}
	return false;
}

function clone(obj) {
	var copy= jQuery.extend({},obj);
	return copy;
}

function movement(targetDiv, source, target, movement, aisles, roomCoordinates){
	var lineData = [];
	//find source and target coordinates
	for (i=0;i<roomCoordinates.length;i++)	{
		if (roomCoordinates[i].name==source){
			var sourceco=roomCoordinates[i];
		}
		if (roomCoordinates[i].name==target){
			var targetco=roomCoordinates[i];
		}
	}
	//find source and target aisles
	var sourceAisle, targetAisle;
	for (var i=0;i<aisles.length;i++)
	{
		if (inArray(source,aisles[i].rooms)){
			 sourceAisle=aisles[i];
		}
		if (inArray(target,aisles[i].rooms)){
			 targetAisle=aisles[i];
		}
	}
	var path=findPath(sourceAisle,targetAisle,aisles);

	var currentP={"x":clone(sourceco).x*mapscale-87,"y":clone(sourceco).y*mapscale};
	lineData.push(clone(currentP));
	for (var i=0;i<path.length;i++){
		if (path[i].direction=="WE"){
			currentP.y=path[i].y*mapscale;
		}
		if (path[i].direction=="NS"){
			currentP.x=path[i].x*mapscale-87;
		}
		lineData.push(clone(currentP));
	}

	if (path[path.length-1].direction=="WE"){
		currentP.x=targetco.x*mapscale-87;
	}
	if (path[path.length-1].direction=="NS"){
		currentP.y=targetco.y*mapscale;
	}
	lineData.push(clone(currentP));
	lineData.push({"x":clone(targetco).x*mapscale-87,"y":clone(targetco).y*mapscale});

	var lineFunction = d3.svg.line()
							 .x(function(d) { return d.x; })
							 .y(function(d) { return d.y; })
							 .interpolate("linear");
	var lineGraph = d3.select(targetDiv + " svg").append("path")
						 .attr("d", lineFunction(lineData))
						 .attr("stroke", function(){
							if (movement >= 8) {
								return "#285081";
							} else if (movement >= 6) {
								return "#4A6491";
							} else if (movement >= 4) {
								return "#447AA1";
							} else if (movement >= 2) {
								return "#64A0E2";
							} else {
								return "#94C6F2";
							};
						 })
						 .attr("stroke-width", 2*movement)
						 .attr("fill", "none")
						 .attr("class","movement")
						 .attr("data-source",source)
						 .attr("data-target",target)
						 .attr("data-movement",movement)
						 .style("opacity",.8)


						 .on("mouseover", function() {
							var source = d3.select(this).attr("data-source");
							var target = d3.select(this).attr("data-target");

							$(targetDiv + " .hover_path").html("<p>From: "+source+"</p><p>To: "+target+"</p><p>Movements: "+movement+"</p>");


							$(this).appendTo(d3.select(targetDiv + " svg")).css("stroke","#FF4F1F").css("opacity",1);


							d3.select(targetDiv + " svg").selectAll(".roomcircle")
									.filter(function(d){
									return d3.select(this).attr('data-name') === source || d3.select(this).attr('data-name') === target;
									})

									.transition()
									.attr("r", 7)
									.attr("fill", "#FF4F1F")

						})
						.on("mouseout", function(d){
							var movementn = d3.select(this).attr("data-movement");

							d3.select(this).style("stroke",  function(){

									if (movementn >= 8) {
										return "#285081";
									} else if (movementn >= 6) {
										return "#4A6491";
									} else if (movementn >= 4) {
										return "#447AA1";
									} else if (movementn >= 2) {
										return "#64A0E2";
									} else {
										return "#94C6F2";
									};
							})

						.style("opacity", .9);

						$(targetDiv + " .hover_path").text('');

					d3.select(targetDiv + " svg").selectAll(".roomcircle")
									.filter(function(d){
									return d3.select(this).attr('data-name') === source ||d3.select(this).attr('data-name') === target;
						})
						.transition()
						.attr("r", 5)
						.attr("fill", "orange");
						});

	lineGraph.append("title").
			text("From: "+source+"\nTo: "+target+"\nMovements: "+movement);
var pathLength= lineGraph.node().getTotalLength();

lineGraph
	.attr("stroke-dasharray", pathLength + " " + pathLength)
	.attr("stroke-dashoffset", pathLength)
	.transition()
	.duration(1000)
	.ease("linear")
	.attr("stroke-dashoffset", 0);
}



function findPath(sourceAisle,targetAisle,aisles){
	var path=[];
	var depth=1;
	var greedyAisles=[{"depth":depth,"parent":null,"aisle":sourceAisle}];
	var found=false;
	var k=0;

	if(sourceAisle!=targetAisle){
	while(0<1){
		k++;
		if(k>10){break;}
		depth++;
		parentAisle=greedyAisles[greedyAisles.length-1].aisle;

		for (var i=0; i<parentAisle.across.length; i++){
				var curaisle=aisles.filter(function(taisle){return taisle.number==parentAisle.across[i];})[0];
				greedyAisles.push({"depth":depth,"parent":parentAisle,"aisle":curaisle});

			if (targetAisle==curaisle){found=true;break;}
		}


		if(found){break;}
		}

	}

	var cnode=greedyAisles[greedyAisles.length-1];
	path.unshift(clone(cnode.aisle));
	for (var j=depth; j>1; j--){
		cnode=greedyAisles.filter(function(pa){ return pa.depth==(j-1) && pa.aisle==cnode.parent;})[0];
		path.unshift(clone(cnode.aisle));
	}
	return path;
}
