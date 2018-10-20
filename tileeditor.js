/* Tile Editor for HousePanel
 * 
 * Original version by @nitwit on SmartThings forum
 * heavily modified by Ken Washington @kewashi on the forum
 * 
 * Designed for use only with HousePanel for Hubitat and SmartThings
 * (c) Ken Washington 2017, 2018
 * 
 */
var savedSheet;
var priorIcon = "none";
var defaultShow = "block";
var defaultOverlay = "block";

function getOnOff(str_type) {
    var onoff = ["",""];
    
    switch (str_type) {
        case "switch" :
        case "switchlevel":
        case "bulb":
        case "light":
        case "momentary":
            onoff = ["on","off"];
            break;
        case "contact":
        case "door":
        case "valve":
            onoff = ["open","closed"];
            break;
        case "motion":
            onoff = ["active","inactive"];
            break;
        case "lock":
            onoff = ["locked","unlocked"];
            break;
        case "pistonName":
            onoff = ["firing","idle"];
            break;
        case "thermofan":
            onoff = ["auto","circulate","on"];
            break;
        case "thermomode":
            onoff = ["heat","cool","auto","off"];
            break;
        case "thermostate":
            onoff = ["idle","heating","cooling","off"];
            break;
        case "musicstatus":
            onoff = ["stopped","paused","playing"];
            break;
        case "musicmute":
            onoff = ["muted","unmuted"];
            break;
        case "presence":
            onoff = ["present","absent"];
            break;
    }
    
    return onoff;
}

function getCssRuleTarget(str_type, subid, thingindex, useall) {

    // get the scope to use
    if ( useall === undefined ) {
        var scope = $("#scopeEffect").val();
        if ( scope=== "alltypes") { useall= 1; }
        else if ( scope=== "alltiles") { useall= 2; }
        else { useall = 0; }
    } else {
        if ( !useall || useall!==1 || useall!==2 ) { 
            useall= 0; 
        }
    }

    var target = "";

    // if a tile isn't specified we default to changing all things
    if ( thingindex===null || thingindex===undefined || thingindex==="all" ) {
        target = "div.thing";
        if ( str_type && useall!==2 ) {
            target+= "." + str_type + "-thing";
        }
    } else if ( subid==="head" ) {
        target = "div.thingname";
        if ( useall < 2 ) { target+= "." + str_type; }
        if ( useall < 1 ) { 
            target+= '.t_'+thingindex;
            // target+= " span.original.n_"+thingindex;
        }

    // handle special case when whole tile is being requested
    } else if ( subid==="wholetile"  || subid==="tile" ) {
        target = "div.thing";
        if ( useall < 2 ) { target+= "." + str_type + "-thing"; }
        if ( useall < 1 ) { target+= '.p_'+thingindex; }
    
    } else if ( subid==="overlay" ) {
        target = "div.overlay";
        if ( useall < 2 ) {
            if ( subid.startsWith("music-") ) {
                target+= ".music-controls";
            } else {
                target+= "." + subid;
            }
        }
        if ( useall < 1 ) { target+= '.v_'+thingindex; }
        
    // main handling of type with subid specific case
    // starts just like overlay but adds all the specific subid stuff
    } else {

        // handle music controls special case
        // target = "div." + str_type + "-thing div.overlay";
        target = "div.overlay";
        if ( useall < 2 ) {
            if ( subid.startsWith("music-") ) {
                target+= ".music-controls";
            } else {
                target+= "." + subid;
            }
        }
        if ( useall < 1 ) { target+= '.v_'+thingindex; }

        // for everything other than levels, set the subid target
        // levels use the overlay layer only
        if ( useall < 2 && subid!=="level" ) {
            // target+= " div."+str_type;

            // handle special wrapper cases (music and thermostats)
            if ( subid === "cool" || subid==="heat" ) { 
                target+= " div." + subid + "-val"; 
            } else {
                target+= " div."+str_type + "." + subid;
            }
            if ( useall < 1 ) target+= '.p_'+thingindex;
        }

        // get the on/off state
        // set the target to determine on/off status
        // we always use the very specific target to this tile
        if ( subid==="name" || subid==="track" || subid==="weekday" || 
             subid==="color" || subid==="level" || 
             subid==="cool" || subid==="heat" ) {
            on = "";
        } else {
            var onofftarget = "div.overlay." + subid + '.v_' + thingindex + " div."+str_type+ '.' + subid + '.p_'+thingindex;
            var on = $(onofftarget).html();
            if ( on && !$.isNumeric(on) && (on.indexOf(" ") === -1) ) {
                on = "."+on;
            } else {
                on = "";
            }
        }

        // if ( on==="." ) { on= ""; }
        target = target + on;
        
        if ( subid==="level" ) {
            console.log ("type= " + str_type+ " target= " + target);
        }
    }

    return target;
}

function toggleTile(target, tile_type, thingindex) {
    var swval = $(target).html();
    var subid = $(target).attr("subid");
    // alert("tile type= "+tile_type+" subid= "+subid);
    
    // activate the icon click to use this
    var onoff = getOnOff(subid);
    var newsub = 0;
    if ( onoff && onoff.length > 0 ) {
        for ( var i=0; i < onoff.length; i++ ) {
            var oldsub = onoff[i];
            if ( $(target).hasClass(oldsub) ) { 
                $(target).removeClass(oldsub); 
                console.log("Removing attribute (" + oldsub + ") from wysiwyg display for tile: " + tile_type);
            }
            if ( oldsub === swval ) {
                newsub = i+1;
                if ( newsub >= onoff.length ) { newsub= 0; }
                $(target).html( onoff[newsub] );
                console.log("Adding attribute (" + onoff[newsub] + ") to wysiwyg display for tile: " + tile_type);
                break;
            }
        }
        $(target).addClass( onoff[newsub] );
    }
                
    initColor(tile_type, subid, thingindex);
    loadSubSelect(tile_type, subid, thingindex);
};

// activate ability to click on icons
function setupIcons(category, str_type, thingindex) {
//    $("div.cat." + category).off("click","img");
//    $("div.cat." + category).on("click","img",function() {
    $("#iconList").off("click","img");
    $("#iconList").on("click","img", function() {
        var img = $(this).attr("src");


        var subid = $("#subidTarget").html();
        var strIconTarget = getCssRuleTarget(str_type, subid, thingindex);
        console.log("Clicked on img= "+img+" Category= "+category+" icontarget= "+strIconTarget+" type= "+str_type+" subid= "+subid+" index= "+thingindex);
        iconSelected(category, strIconTarget, img, str_type, subid, thingindex);
    });
}

function initDialogBinds(str_type, thingindex) {
	
    // set up the trigger for only the tile being edited
    // and use the real tile div as the target
    var trigger = "div"; // div." + str_type + ".p_"+thingindex;
    $("#wysiwyg").on('click', trigger, function(event) {
        // alert("toggling class= " + $(event.target).attr("class") + " id= " + $(event.target).attr("id") );
        // if ( $(event.target).attr("id") &&  $(event.target).attr("subid") ) {
        if ( $(event.target).attr("subid") ) {
            toggleTile(event.target, str_type, thingindex);
        } else if ( $(event.target).hasClass("thingname") || $(event.target).hasClass("original")  ) {
            initColor(str_type, "head", thingindex);
            loadSubSelect(str_type, "head", thingindex);
        } else {
            initColor(str_type, "wholetile", thingindex);
            loadSubSelect(str_type, "wholetile", thingindex);
        }
        event.stopPropagation();
    });

    $("#wholetile").on('click', function(event) {
        // alert("Whole tile background not yet implemented...");
        initColor(str_type, "wholetile", thingindex);
        event.stopPropagation();
    });
        
    $('#noIcon').on('change', function() {
        var subid = $("#subidTarget").html();
        var cssRuleTarget = getCssRuleTarget(str_type, subid, thingindex);
        var strEffect = getBgEffect();
        
        if( $("#noIcon").is(':checked') ){
            priorIcon = $(cssRuleTarget).css("background-image");
            addCSSRule(cssRuleTarget, "background-image: none" + strEffect + ";");
        } else {
            // removeCSSRule(cssRuleTarget, thingindex, "background-image:");
            if ( priorIcon!=="none" ) {
                addCSSRule(cssRuleTarget, "background-image: " + priorIcon + strEffect + ";");
            }
        }
    });
	
    $('#noHead').on('change', function(event) {
        var cssRuleTarget = getCssRuleTarget(str_type, 'head', thingindex);
        if($("#noHead").is(':checked')){
            addCSSRule(cssRuleTarget, "display: none;", true);
            // removeCSSRule(cssRuleTarget, thingindex, "border-bottom:");
            // removeCSSRule(cssRuleTarget, thingindex, "border-left:");
            $("#editName").prop("disabled", true);
        } else {
            // removeCSSRule(cssRuleTarget, thingindex, "display:");
            addCSSRule(cssRuleTarget, "display: block;", true);
            // addCSSRule(cssRuleTarget, "border-bottom: " + " 5px solid rgba(0, 0, 80, 1)")
            $("#editName").prop("disabled", false);
        }
        event.stopPropagation;
    });	
    
    var cssRuleTarget = getCssRuleTarget(str_type, 'head', thingindex);
    var csstext = $(cssRuleTarget).css("display");
    if ( csstext === "none" ) {
        $("#noHead").prop("checked", true);
    } else {
        $("#noHead").prop("checked", false);
    }
//    console.log ("csstarget = " + cssRuleTarget + " txt= " + csstext);
    
    $("#editName").on('input', function () {
        var target1 = "span.original.n_"+thingindex;
//        var newsize = parseInt( $("#tileWidth").val() );
//        var rule = "width: " + newsize.toString() + "px;";
//        addCSSRule(target1, rule);

        var newname = $("#editName").val();
        $(target1).html(newname);
        // addCSSRule(target2, "content: " + newname + ";" );
        // event.stopPropagation;
    });

    $("#iconSrc").on('change', function (event) {
        getIcons(str_type, thingindex);	
        event.stopPropagation;
    });
    
    $("#autoBgSize").on('change', function(event) {
        var subid = $("#subidTarget").html();
       
        if ( $("#autoBgSize").is(":checked") ) {
            $("#bgSize").prop("disabled", true);
        } else {
            $("#bgSize").prop("disabled", false);
        }
        updateSize(str_type, subid, thingindex);
        event.stopPropagation;
    });
    
    $("#bgSize").on('input', function(event) {
        var subid = $("#subidTarget").html();
        updateSize(str_type, subid, thingindex);
        event.stopPropagation;
    });

    // set overall tile height
    $("#tileHeight").on('input', function(event) {
        var newsize = parseInt( $("#tileHeight").val() );
        var rule = "height: " + newsize.toString() + "px;";
        addCSSRule(getCssRuleTarget(str_type, 'tile', thingindex), rule);
        event.stopPropagation;
    });

    // set overall tile width and header and overlay for all subitems
    $("#tileWidth").on('input', function(event) {
        var newsize = parseInt( $("#tileWidth").val() );
        var rule = "width: " + newsize.toString() + "px;";
        addCSSRule(getCssRuleTarget(str_type, 'tile', thingindex), rule);
        addCSSRule(getCssRuleTarget(str_type, 'head', thingindex), rule);
        
        // handle special case of thermostats that need to have widths fixed
        if ( str_type === "thermostat" ) {
            var midsize = newsize - 64;
            rule = "width: " + midsize.toString() + "px;";
            addCSSRule( "div.thermostat-thing.p_"+thingindex+" div.heat-val", rule);
            addCSSRule( "div.thermostat-thing.p_"+thingindex+" div.cool-val", rule);
        }
        event.stopPropagation;
    });

    // set overall tile width and height header and overlay for all subitems
    var target = getCssRuleTarget(str_type, 'tile', thingindex);
    var tilewidth = $(target).width();
    var tilehigh = $(target).height();
    
    tilewidth = parseInt(tilewidth);
    $("#tileWidth").val(tilewidth);
    tilehigh = parseInt(tilehigh);
    $("#tileHeight").val(tilehigh);
    
    $("#autoTileWidth").on('change', function(event) {
        var rule;
        var midrule;
        if($("#autoTileWidth").is(':checked')) {
            rule = "width: auto;";
            midrule = "width: 72px;";
            $("#tileWidth").prop("disabled", true);
            $("#tileWidth").css("background-color","gray");
        } else {
            var newsize = parseInt( $("#tileWidth").val() );
            rule = "width: " + newsize.toString() + "px;";
            $("#tileWidth").prop("disabled", false);
            $("#tileWidth").css("background-color","white");
            var midsize = newsize - 64;
            midrule = "width: " + midsize.toString() + "px;";
        }
        addCSSRule(getCssRuleTarget(str_type, 'tile', thingindex), rule);
        
        if ( str_type === "thermostat" ) {
            addCSSRule( "div.thermostat-thing.p_"+thingindex+" div.heat-val", midrule);
            addCSSRule( "div.thermostat-thing.p_"+thingindex+" div.cool-val", midrule);
        }
        event.stopPropagation;
    });

    // set overall tile width and header and overlay for all subitems
    $("#autoTileHeight").on('change', function(event) {
        var rule;
        if($("#autoTileHeight").is(':checked')) {
            rule = "height: auto;";
            $("#tileHeight").prop("disabled", true);
            $("#tileHeight").css("background-color","gray");
        } else {
            var newsize = parseInt( $("#tileHeight").val() );
            rule = "height: " + newsize.toString() + "px;";
            $("#tileHeight").prop("disabled", false);
            $("#tileHeight").css("background-color","white");
        }
        addCSSRule(getCssRuleTarget(str_type, "tile", thingindex), rule);
        event.stopPropagation;
    });

    // set overall tile width and header and overlay for all subitems
    $("#editHeight").on('input', function(event) {
        var newsize = parseInt( $("#editHeight").val() );
        var subid = $("#subidTarget").html();
        if ( subid !== "wholetile" ) {
            var target = getCssRuleTarget(str_type, subid, thingindex);
            var rule = "height: " + newsize.toString() + "px;";
            addCSSRule(target, rule);
        }
        event.stopPropagation;
    });

    // set overall tile width and header and overlay for all subitems
    $("#editWidth").on('input', function(event) {
        var newsize = parseInt( $("#editWidth").val() );
        var subid = $("#subidTarget").html();
        if ( subid !== "wholetile" ) {
            var target = getCssRuleTarget(str_type, subid, thingindex);
            var rule = "width: " + newsize.toString() + "px;";
            addCSSRule(target, rule);
        }
        event.stopPropagation;
    });

    // set the item height
    $("#autoHeight").on('change', function(event) {
        var subid = $("#subidTarget").html();
        var rule;
        if ( $("#autoHeight").is(":checked") ) {
            // special handling for default temperature circles
            if ( subid==="temperature" || subid==="feelsLike" ) {
                rule = "height: 50px; border-radius: 50%;  padding-left: 0; padding-right: 0; ";
            } else {
                rule = "height: auto;";
            }
            $("#editHeight").prop("disabled", true);
            $("#editHeight").css("background-color","gray");
        } else {
            var newsize = parseInt( $("#editHeight").val() );
            // special handling for default temperature circles
            $("#editHeight").prop("disabled", false);
            $("#editHeight").css("background-color","white");
            if ( newsize === 0 ) {
                newsize = "148px;";
            } else {
                newsize = newsize.toString() + "px;";
            }
            rule = "height: " + newsize;
        }
        if ( subid !== "wholetile" ) {
            addCSSRule(getCssRuleTarget(str_type, subid, thingindex), rule);
        }
        event.stopPropagation;
    });

    // set the item width
    $("#autoWidth").on('change', function(event) {
        var subid = $("#subidTarget").html();
        var rule;
        if ( $("#autoWidth").is(":checked") ) {
            // special handling for default temperature circles
            if ( subid==="temperature" || subid==="feelsLike" ) {
                rule = "width: 70px; border-radius: 50%;  padding-left: 0; padding-right: 0; ";
            } else {
                rule = "width: 92%; padding-left: 4%; padding-right: 4%;";
            }
            $("#editWidth").prop("disabled", true);
            $("#editWidth").css("background-color","gray");
            if ( subid !== "wholetile" ) {
                addCSSRule(getCssRuleTarget(str_type, subid, thingindex), rule);
            }
        } else {
            var newsize = parseInt( $("#editWidth").val() );
            $("#editWidth").prop("disabled", false);
            $("#editWidth").css("background-color","white");
            if ( newsize === 0 ) {
                rule = "width: 92%; padding-left: 4%; padding-right: 4%;";
            } else {
                newsize = newsize.toString() + "px;";
                rule = "width: " + newsize + " padding-left: 0; padding-right: 0; display: inline-block;";
            }
            if ( subid !== "wholetile" ) {
                addCSSRule(getCssRuleTarget(str_type, subid, thingindex), rule);
            }
        }
        event.stopPropagation;
    });

    // set padding for selected item
    $("#topPadding").on('change', function(event) {
        var subid = $("#subidTarget").html();
        var newsize = parseInt( $("#topPadding").val() );
        if ( !newsize || isNaN(newsize) ) { 
            newsize = "0px;";
        } else {
            newsize = newsize.toString() + "px;";
        }
        var rule = "padding-top: " + newsize;
        if ( subid === "wholetile" ) {
            rule = "background-position-y: " + newsize;
        }
        addCSSRule(getCssRuleTarget(str_type, subid, thingindex), rule);
        event.stopPropagation;
    });

    // set padding for selected item
    $("#botPadding").on('change', function(event) {
        var subid = $("#subidTarget").html();
        var newsize = parseInt( $("#botPadding").val() );
        if ( !newsize || isNaN(newsize) ) { 
            newsize = "0px;";
        } else {
            newsize = newsize.toString() + "px;";
        }
        var rule = "padding-left: " + newsize;
        if ( subid === "wholetile" ) {
            rule = "background-position-x: " + newsize;
        }
        addCSSRule(getCssRuleTarget(str_type, subid, thingindex), rule);
        event.stopPropagation;
    });
    
}

function iconlist() {
    var dh = "";
	dh += "<div id='editicon'>";
	dh += "<div id='iconChoices'>";
	dh += "<select name=\"iconSrc\" id=\"iconSrc\" class=\"ddlDialog\"></select>";
//	dh += "<input type=\"checkbox\" id=\"invertIcon\">";
//	dh += "<label class=\"iconChecks\" for=\"invertIcon\">Invert</label>";	
	dh += "<input type='checkbox' id='noIcon'>";
	dh += "<label class=\"iconChecks\" for=\"noIcon\">None</label>";
	dh += "</div>";
	dh += "<div id='iconList'></div>";
	dh += "</div>";
    return dh;
}

function editSection(str_type, thingindex) {
    var dh = "";
        dh += "<div id='editSection'>";
        dh += effectspicker(str_type, thingindex);
        dh += sizepicker(str_type, thingindex);
        dh += "</div>";
    return dh;
}

function effectspicker(str_type, thingindex) {
    var dh = "";
    // var target = "div." + str_type + "-thing span.original.n_" + thingindex;
    var target = getCssRuleTarget(str_type, "head", thingindex);
    target = target +  " span.original.n_" + thingindex;
    var name = $(target).html();

    // Title changes and options
	dh += "<div class='colorgroup'><label>Title (blank = reset):</label><input name=\"editName\" id=\"editName\" class=\"ddlDialog\" value=\"" + name +"\"></div>";
        
	//Effects
	dh += "<div class='colorgroup'><label>Effect Scope:</label>";
	dh += "<select name=\"scopeEffect\" id=\"scopeEffect\" class=\"ddlDialog\">";
	dh += "<option value=\"thistile\" selected>This " + str_type + " tile</option>";
	dh += "<option value=\"alltypes\">All " + str_type + " tiles</option>";
	dh += "<option value=\"alltiles\">All tiles</option>";
	dh += "</select>";
	dh += "</div>";
    return dh;    
}

function sizepicker(str_type, thingindex) {
    var dh = "";

    var subid = setsubid(str_type);
    var target = getCssRuleTarget(str_type, subid, thingindex);  // "div.thing";
    var size = $(target).css("background-size");
    // alert("old size: " + size);
    size = parseInt(size);
    if ( isNaN(size) ) { 
        size = 80; 
        if ( subid === "wholetile" ) { size = 150; }
    }
    
    // icon size effects
    dh += "<div class='sizeText'></div>";
    dh += "<div class='editSection_input'>";
    dh += "<label for='bgSize'>Background Size: </label>";
    dh += "<input size='8' type=\"number\" min='10' max='400' step='10' id=\"bgSize\" value=\"" + size + "\"/>";
    dh += "</div>";
    dh += "<div class='editSection_input'><input type='checkbox' id='autoBgSize'><label class=\"iconChecks\" for=\"autoBgSize\">Auto?</label></div>";

    // overall tile size effect -- i dont' know why I had this set different?
    // var target2 = "div.thing."+str_type+"-thing";
    var target2 = target;
    
    var th = $(target2).css("height");
    var tw = $(target2).css("width");
    if ( !th || th.indexOf("px") === -1 ) { 
        th= 0; 
    } else {
        th = parseInt(th);
    }
    if ( tw==="auto" || !tw || tw.indexOf("px") === -1 ) { 
        tw= 0; 
    } else {
        tw = parseInt(tw);
    }
    
    var h = $(target).css("height");
    var w = $(target).css("width");
    if ( !h || !h.hasOwnProperty("indexOf") || h.indexOf("px") === -1 ) { 
        h= 0; 
    } else {
        h = parseInt(h);
    }
    if ( !w || !w.hasOwnProperty("indexOf") ||  w.indexOf("px") === -1 ) { 
        w= 0; 
    } else {
        w = parseInt(w);
    }
    
    dh += "<div class='sizeText'>Overall Tile Size</div>";
    dh += "<div class='editSection_input'>";
    dh += "<label for='tileHeight'>Tile H: </label>";
    dh += "<input size='8' type=\"number\" min='10' max='800' step='10' id=\"tileHeight\" value=\"" + th + "\"/>";
    dh += "</div>";
    dh += "<div class='editSection_input autochk'>";
    dh += "<label for='tileWidth'>Tile W: </label>";
    dh += "<input size='8' type=\"number\" min='10' max='800' step='10' id=\"tileWidth\" value=\"" + tw + "\"/>";
    dh += "</div>";
    dh += "<div class='editSection_input autochk'><input type='checkbox' id='autoTileHeight'><label class=\"iconChecks\" for=\"autoTileHeight\">Auto H?</label></div>";
    dh += "<div class='editSection_input autochk'><input type='checkbox' id='autoTileWidth'><label class=\"iconChecks\" for=\"autoTileWidth\">Auto W?</label></div>";

    dh += "<div class='sizeText'><p>Text Size & Position:</p></div>";
    dh += "<div class='editSection_input autochk'>";
    dh += "<label for='editHeight'>Text H: </label>";
    dh += "<input size='4' type=\"number\" min='5' max='400' step='5' id=\"editHeight\" value=\"" + h + "\"/>";
    dh += "</div>";
    dh += "<div>";
    dh += "<div class='editSection_input autochk'>";
    dh += "<label for='editWidth'>Text W: </label>";
    dh += "<input size='4' type=\"number\" min='5' max='400' step='5' id=\"editWidth\" value=\"" + w + "\"/>";
    dh += "</div>";
    dh += "</div>";
    dh += "<div class='editSection_input autochk'><input type='checkbox' id='autoHeight'><label class=\"iconChecks\" for=\"autoHeight\">Auto H?</label></div>";
    dh += "<div class='editSection_input autochk'><input type='checkbox' id='autoWidth'><label class=\"iconChecks\" for=\"autoWidth\">Auto W?</label></div>";

    // font size (returns px not pt)
    var ptop = parseInt($(target).css("padding-top"));
    var pbot = parseInt($(target).css("padding-bottom"));
    
    if ( !ptop || isNaN(ptop) ) { ptop = 0; }
    if ( !pbot || isNaN(pbot) ) { pbot = 0; }
    dh += "<div class='editSection_input'>";
    dh += "<label for='topPadding'>Top Padding:</label>\t";
    dh += "<input size='4' type=\"number\" min='0' max='100' step='5' id=\"topPadding\" value=\"" + ptop + "\"/>";
    dh += "</div>";    dh += "<div class='editSection_input'>";
    dh += "<label for='botPadding'>Left Padding:</label>\t";
    dh += "<input size='4' type=\"number\" min='0' max='100' step='5' id=\"botPadding\" value=\"" + pbot + "\"/>";
    dh += "</div>";
    
    return dh;
}

function colorpicker(str_type, thingindex) {
    var dh = "";
    // dh += "<div id='pickerWrapper'>";
//    dh += "<button id='editReset' type='button'>Reset</button>";
//    dh += "<div class='dlgtext'>Setting Icon: </div><div id='subidTarget' class='dlgtext'>" + str_type + "</div>";
//    dh += "<div id='onoffTarget' class='dlgtext'>" + "" + "</div>";
    
    // this section is loaded later with a bunch of color pickers
    // including script to respond to picked color
    dh += "<div id='colorpicker'></div>";
    return dh;
}

// popup dialog box now uses createModal
function editTile(str_type, thingindex, thingclass, hubnum, htmlcontent) {  

    // save the sheet upon entry for cancel handling
    savedSheet = document.getElementById('customtiles').sheet;
    
    // * DIALOG START *	
    var dialog_html = "<div id='tileDialog' class='tileDialog'>";
	
    // header
    dialog_html += "<div id='editheader'>Editing Tile #" + thingindex + 
                   " of Type: " + str_type + " From hub #" + hubnum + "</div>";

    // option on the left side - colors and options
    dialog_html += colorpicker(str_type, thingindex);
    dialog_html += editSection(str_type, thingindex);
    
    // icons on the right side
    dialog_html += iconlist();
    
    // tileEdit display on the far right side 
    dialog_html += "<div id='tileDisplay' class='tileDisplay'>";
    dialog_html += "<div class='editInfo'>Click to Select or Change State</div>";
    
    // we either use the passed in content or make an Ajax call to get the content
    var jqxhr = null;
    if ( htmlcontent ) {
        dialog_html += "<div class=\"" + thingclass + "\" id='wysiwyg'>" + htmlcontent + "</div>";
    } else {
        // put placeholder and populate after Ajax finishes retrieving true wysiwyg content
        dialog_html += "<div class=\"thing " + str_type + "-thing p_"+thingindex+"\" id='wysiwyg'></div>";
        jqxhr = $.post("housepanel.php", 
            {useajax: "wysiwyg", id: '', type: '', tile: thingindex, value: '', attr: ''},
            function (presult, pstatus) {
                if (pstatus==="success" ) {
                    htmlcontent = presult;
                }
            }
        );
    }
    dialog_html += "<div id='subsection'></div>";
    dialog_html += "</div>";
    
    // * DIALOG_END *
    dialog_html += "</div>";
    
    // create a function to display the tile
    var firstsub = setsubid(str_type);
    var dodisplay = function() {
        var pos = {top: 100, left: 200};
        createModal( dialog_html, "body", true, pos, 
            // function invoked upon leaving the dialog
            function(ui, content) {
                var clk = $(ui).attr("name");
                // alert("clk = "+clk);
                if ( clk==="okay" ) {
                    var newname = $("#editName").val();
                    saveTileEdit(str_type, thingindex, newname);
                } else if ( clk==="cancel" ) {
                    cancelTileEdit(str_type, thingindex);
                }
            },
            // function invoked upon starting the dialog
            function(hook, content) {
                // find the first clickable item
                getIcons(str_type, thingindex);	
                initColor(str_type, firstsub, thingindex);
                // we could start with the entire tile selected
                // initColor(str_type, "wholetile", thingindex);
                initDialogBinds(str_type, thingindex);
                $("#modalid").draggable();
            }
        );
    };
    
    if ( jqxhr ) {
        jqxhr.done(function() {
            dodisplay();
            $("#wysiwyg").html(htmlcontent);
            loadSubSelect(str_type, firstsub, thingindex);
        });
    } else {
        dodisplay();
        loadSubSelect(str_type, firstsub, thingindex);
    }

}

function loadSubSelect(str_type, firstsub, thingindex) {
        
    // get list of all the subs this tile supports
    var subcontent = "";
    subcontent += "<br><div class='editInfo'>Select Feature:</div>";
    subcontent += "<select id='subidselect' name='subselect'>";
    
    if ( firstsub === "wholetile" ) {
        subcontent += "<option value='wholetile' selected>Whole Tile</option>";
    } else {
        subcontent += "<option value='wholetile'>Whole Tile</option>";
    }
    
    if ( firstsub === "head" ) {
        subcontent += "<option value='head' selected>Head Title</option>";
    } else {
        subcontent += "<option value='head'>Head Title</option>";
    }
    // var idsubs = "";
    var subid;
    // var firstsub = setsubid(str_type);

    $("#wysiwyg div.overlay").each(function(index) {
        var classes = $(this).attr("class");
        var words = classes.split(" ", 3);
        subid = words[1];
        if ( subid ) {
            // handle music controls
            if ( subid==="music-controls" ) {
                var that = $(this);
                that.children().each(function() {
                   var musicsub = $(this).attr("subid");
                    subcontent += "<option value='" + musicsub +"'";
                    if ( musicsub === firstsub ) {
                        subcontent += " selected";
                    }
                    subcontent += ">" + musicsub + "</option>";;
                });
            }
            
            // limit selectable sub to exclude color since that is special
            else if ( subid!=="color" ) {
                subcontent += "<option value='" + subid +"'";
                if ( subid === firstsub ) {
                    subcontent += " selected";
                }
                subcontent += ">" + subid + "</option>";;
            }
        }
    });
    // console.log("classes: " + idsubs);
    subcontent += "</select>";
    // console.log("subcontent = " + subcontent);
    $("#subsection").html(subcontent);
    $("#subidselect").off('change');
    $("#subidselect").on('change', function(event) {
        var subid = $(event.target).val();
        initColor(str_type, subid, thingindex);
        event.stopPropagation();
    });
    
}

function setsubid(str_type) {
    var subid = str_type;
    switch(str_type) {
        case "bulb":
        case "light":
        case "switch":
        case "valve":
        case "switchlevel":
            subid = "switch";
            break;

        case "thermostat":
        case "temperature":
        case "weather":
            subid = "temperature";
            break;

        case "music":
            subid = "track";
            break;

        case "clock":
            subid = "time";
            break;
            
        case "presence":
        case "momentary":
        case "door":
            subid = str_type;
            break;
            
        default:
            subid = "wholetile";
            break;
    }
    // $("#subidTarget").html(subid);
    return subid;
}

function saveTileEdit(str_type, thingindex, newname) {
    var returnURL;
    try {
        returnURL = $("input[name='returnURL']").val();
    } catch(e) {
        returnURL = "housepanel.php";
    }

    // get all custom CSS text
    var sheet = document.getElementById('customtiles').sheet;
    var sheetContents = "";
    c=sheet.cssRules;
    for(j=0;j<c.length;j++){
        sheetContents += c[j].cssText;
    };
    var regex = /[{;}]/g;
    var subst = "$&\n";
    sheetContents = sheetContents.replace(regex, subst);
    
    // post changes to save them in a custom css file
    $.post(returnURL, 
        {useajax: "savetileedit", id: "1", type: str_type, value: sheetContents, attr: newname, tile: thingindex},
        function (presult, pstatus) {
            if (pstatus==="success" ) {
                console.log("POST success - newname = " + newname + " id= "+thingindex); // Custom CSS saved:\n"+ presult );
            } else {
                console.log("POST error= " + pstatus);
            }
        }
    );
}

function cancelTileEdit(str_type, thingindex) {
    document.getElementById('customtiles').sheet = savedSheet;
    location.reload(true);
}

function resetInverted(selector) {
    var sheet = document.getElementById('customtiles').sheet; // returns an Array-like StyleSheetList
    for (var i=sheet.cssRules.length; i--;) {
        var current_style = sheet.cssRules[i];
        if(current_style.selectorText === selector){
            if(current_style.cssText.indexOf("invert") !== -1) {
                current_style.style.filter="";	
            }	  		
        }
    }
}

// add all the color selectors to the colorpicker div
function initColor(str_type, subid, thingindex) {
  
    var target;
    var generic;
    var newonoff;
    var onstart;
    var ictarget;

    // selected background color
    target = getCssRuleTarget(str_type, subid, thingindex, 0);
    generic = getCssRuleTarget(str_type, subid, thingindex, 1);
    ictarget = target;
    newonoff = "";
    var swval = $(target).html();
    var onoff = getOnOff(subid);
    if ( onoff && onoff.length > 0 ) {
        for ( var i=0; i < onoff.length; i++ ) {
            var oldsub = onoff[i];
            if ( swval === oldsub ) {
                newonoff = oldsub;
                break;
            }
        }
    }
    var icontarget = target;
    
    // set the default icon to last one
    priorIcon = $(icontarget).css("background-image");

    // set the background size
    var iconsize = $(icontarget).css("background-size");
    if ( iconsize==="auto" ) {
        $("#autoBgSize").prop("checked", true);
        $("#bgSize").prop("disabled", true);
        $("#bgSize").css("background-color","gray");
    } else {
        $("#autoBgSize").prop("checked", false);
        $("#bgSize").prop("disabled", false);
        $("#bgSize").css("background-color","white");
        iconsize = $("#bgSize").val();
        iconsize = parseInt(iconsize, 10);
        if ( isNaN(iconsize) || iconsize <= 0 ) { 
            iconsize = $(generic).css("background-size");
            if ( isNaN(iconsize) || iconsize <= 0 ) { 
                iconsize = 80; 
                if ( subid === "wholetile" ) { iconsize = 150; }
            }
            if ( str_type==="music" ) { iconsize = 40; }
        }
        $("#bgSize").val(iconsize);
    }
    
    // set the item height and width parameters
    if ( subid!=="wholetile" && subid!=="head" ) {
        var tilewidth = $(icontarget).css("width");
        var tileheight = $(icontarget).css("height");
        
        if ( tileheight==="auto" ) {
            $("#autoHeight").prop("checked", true);
            $("#autoHeight").prop("disabled", true);
            $("#autoHeight").css("background-color","gray");
        } else {
            $("#autoHeight").prop("checked", false);
            $("#autoHeight").prop("disabled", false);
            $("#autoHeight").css("background-color","white");
            tileheight = parseInt(tileheight,10);
            if ( isNaN(tileheight) || tileheight <= 0 ) { 
                tileheight = $("#editHeight").val();
                // tilewidth = $(target).width();
                if ( isNaN(tileheight) || tileheight <= 0 ) { 
                    tileheight = 80;
                }
            }
            $("#editHeight").val(tileheight);
        }

        
        if ( tilewidth==="auto" ) {
            $("#autoWidth").prop("checked", true);
            $("#editWidth").prop("disabled", true);
            $("#editWidth").css("background-color","gray");
        } else {
            $("#autoWidth").prop("checked", false);
            $("#editWidth").prop("disabled", false);
            $("#editWidth").css("background-color","white");
            tilewidth = parseInt(tilewidth,10);
            if ( isNaN(tilewidth) || tilewidth <= 0 ) { 
                tilewidth = $("#editWidth").val();
                // tilewidth = $(target).width();
                if ( isNaN(tilewidth) || tilewidth <= 0 ) { 
                    tilewidth = 80;
                }
            }
            $("#editWidth").val(tilewidth);
        }
    }
    

    var dh= "";
    dh += "<button id='editReset' type='button'>Reset</button>";
    // dh += "<div class='dlgtext'>Item: </div>";
    dh += "<div id='subidTarget' class='dlgtext'>" + subid + "</div>";
    dh += "<div id='onoffTarget' class='dlgtext'>" + newonoff + "</div>";

    onstart = $(icontarget).css("background-color");
    if ( !onstart || onstart==="rgba(0, 0, 0, 0)" ) {
        onstart = $(generic).css("background-color");
        if ( !onstart || onstart==="rgba(0, 0, 0, 0)" ) { onstart = $("div.thing").css("background-color"); }
        if ( !onstart || onstart==="rgba(0, 0, 0, 0)" ) { onstart = "rgba(0, 0, 0, 1)"; }
    }
    
    // alert("icontarget= " + icontarget+" generic= "+generic+" onstart= "+onstart);
    console.log("target= "+ icontarget+ " initial background-color= "+onstart);
    var iconback = '<div class="colorgroup"> \
                  <label for="iconColor">Background Color</label> \
                  <input type="text" id="iconColor" caller="background" target="' + icontarget + '" \
                  class="colorset" value="' + onstart + '"> \
                  </div>';

    // background effect
    var oneffect = $(icontarget).css("background-image");
    var dirright = false;
    var isdark = false;
    var iseffect = -1;
    if ( oneffect ) { iseffect= oneffect.indexOf("linear-gradient"); }
    if ( iseffect !== -1 ) {
        iseffect = true;
        dirright = ( oneffect.indexOf("to right") !== -1 );
        isdark = ( oneffect.indexOf("50%") !== -1 );
    } else {
        iseffect = false;
    }
    
    var ceffect = "";
    ceffect += "<div class='colorgroup'><label>Background Effect:</label>";
    ceffect += "<select name=\"editEffect\" id=\"editEffect\" class=\"ddlDialog\">";
    
    var effects = [ ["none", "No Effect"],
                    ["hdark","Horiz. Dark"],
                    ["hlight","Horiz. Light"],
                    ["vdark","Vertical Dark"],
                    ["vlight","Vertical Light"]
    ];
    var stext = "";
    $.each(effects, function() {
        ceffect += "<option value=\"" + this[0] + "\"";
        if ( !iseffect && this[0]==="none") { stext = " selected"; }
        else if ( iseffect && dirright && isdark && this[0]==="hdark") { stext = " selected"; }
        else if ( iseffect && dirright && !isdark && this[0]==="hlight") { stext = " selected"; }
        else if ( iseffect && !dirright && isdark && this[0]==="vdark") { stext = " selected"; }
        else if ( iseffect && !dirright && !isdark && this[0]==="vlight") { stext = " selected"; }
        else if ( this[0]==="none") { stext = " selected"; }
        else { stext = ""; }
        
        ceffect += stext + ">" + this[1] + "</option>";
        
        
    });
    ceffect += "</select>";
    ceffect += "</div>";

    var onstart = $(ictarget).css("color");
    if ( !onstart || onstart==="rgba(0, 0, 0, 0)" ) {
        onstart = $(generic).css("color");
        if ( !onstart || onstart==="rgba(0, 0, 0, 0)" ) { onstart = $("div.thing").css("color"); }
        if ( !onstart || onstart==="rgba(0, 0, 0, 0)" ) { onstart = "rgba(255, 255, 255, 1)"; }
    }
    console.log("target= "+ ictarget+ ", initial color= "+onstart);
    var iconfore = '<div class="colorgroup"> \
                  <label for="iconFore">Text Font Color</label> \
                  <input type="text" id="iconFore" \
                  caller="color" target="' + target + '" \
                  class="colorset" value="' + onstart + '"> \
                  </div>';

    // get the default font
    var ffamily = $(target).css("font-family");
    var fweight = $(target).css("font-weight");
    var fstyle = $(target).css("font-style");
    var fontdef;
    
    console.log("ffamily = " + ffamily + " fweight= " + fweight + " fstyle= " + fstyle);
    
    if ( ffamily===undefined || !ffamily || !ffamily.hasOwnProperty(("includes")) ) {
        fontdef = "sans";
    } else if ( ffamily.includes("Raleway") || ffamily.includes("Times") ) {
        fontdef = "serif";
    } else if ( ffamily.includes("Courier") || ffamily.includes("Mono") ) {
        fontdef = "mono";
    } else {
        fontdef = "sans";
    }
    if ( fweight==="bold" || ( $.isNumeric(fweight) && fweight > 500)  ) {
        fontdef+= "b";
    }
    if ( fstyle!=="normal") {
        fontdef+= "i";
    }
    console.log("strtype= " + str_type + " ffamily= " + ffamily + " fweight= " + fweight + " fstyle= " + fstyle + " fontdef = "+ fontdef);
        
    var fe = "";
    fe += "<div class='colorgroup font'><label>Font Type:</label>";
    fe += "<select name=\"fontEffect\" id=\"fontEffect\" class=\"ddlDialog\">";
    
    var fonts = {sans:"Sans", sansb:"Sans Bold", sansi:"Sans Italic", sansbi:"Sans Bold+Italic",
                 serif:"Serif", serifb:"Serif Bold", serifi:"Serif Italic", serifbi:"Serif Bold+Italic",
                 mono:"Monospace", monob:"Mono Bold", monoi:"Mono Italic", monobi:"Mono Bold+Italic" };
    for ( var key in fonts ) {
        if ( fonts.hasOwnProperty(key) ) {
            var checked = "";
            if ( key===fontdef) {
                checked = " selected";
            }
            fe += "<option value=\"" + key + "\"" + checked + ">" + fonts[key] + "</option>";
        }
    }
    fe += "</select>";
    fe += "</div>";
    
    var f = $(ictarget).css("font-size");
    f = parseInt(f);
       
    fe += "<div class='colorgroup font'><label>Font Size (px):</label>";
    fe += "<select name=\"fontEffect\" id=\"editFont\" class=\"ddlDialog\">";
    var sizes = [8,9,10,11,12,14,16,18,20,24,28,32,40,48,60,80,100,120];
    sizes.forEach( function(sz, index, arr) {
        sz = parseInt(sz);
        var checked = "";
        if ( f === sz ) { checked = " selected"; }
        fe+= "<option value=\"" + sz + "px;\"" + checked + ">" + sz + "</option>";
    });
    fe += "</select>";
    fe += "</div>";

    var align = "";
    align += "<div id='alignEffect' class='colorgroup'><label>Text Alignment:</label><div class='editSection_input'>";
    align+= '<input id="alignleft" type="radio" name="align" value="left"><label for="alignleft">Left</label>';
    align+= '<input id="aligncenter" type="radio" name="align" value="center" checked><label for="aligncenter">Center</label>';
    align+= '<input id="alignright" type="radio" name="align" value="right"><label for="alignright">Right</label>';
    align += "</div></div>";
    
    var ishidden = "";
    ishidden += "<div class='editSection_input autochk'>";
    ishidden += "<input type='checkbox' id='isHidden' target='" + target + "'>";
    ishidden += "<label class=\"iconChecks\" for=\"isHidden\">Hide Element?</label></div>";

    var inverted = "<div class='editSection_input autochk'><input type='checkbox' id='invertIcon'><label class=\"iconChecks\" for=\"invertIcon\">Invert Element?</label></div>";

    // insert the color blocks
    $("#colorpicker").html(dh + iconback + ceffect + iconfore + fe + align + ishidden + inverted);

    // turn on minicolor for each one
    $('#colorpicker .colorset').each( function() {
        var strCaller = $(this).attr("caller");
        // alert("caller= "+strCaller);
        var startColor = $(this).val();
        var startTarget = $(this).attr("target");
        var subid = $("#subidTarget").html();
        $(this).minicolors({
            control: "hue",
            position: "bottom left",
            defaultValue: startColor,
            theme: 'default',
            opacity: true,
            format: 'rgb',
            change: function(strColor) {
                updateColor(strCaller, startTarget, str_type, subid, thingindex, strColor);
            }
        });
    });

    $("#invertIcon").off('change');
    $("#invertIcon").on("change",function() {
//        invertImage();
        var strInvert;;
        var subid = $("#subidTarget").html();
        var cssRuleTarget = getCssRuleTarget(str_type, subid, thingindex);
        // alert(cssRuleTarget);
        if($("#invertIcon").is(':checked')){
            strInvert = "filter: invert(1);";
            addCSSRule(cssRuleTarget, strInvert, false);
        } else {
            strInvert = "filter: invert(0);";
            addCSSRule(cssRuleTarget, strInvert, false);	
        }
    });
    
    // $("#editReset").off('change');
    $("#editReset").on('click', function (event) {
        // alert("Reset type= "+tile_type+" thingindex= "+thingindex);
        var subid = $("#subidTarget").html();
        resetCSSRules(str_type, subid, thingindex);
        event.stopPropagation;
    });

    $("#editEffect").off('change');
    $("#editEffect").on('change', function (event) {
        var editEffect = getBgEffect( $(this).val() );
        var subid = $("#subidTarget").html();
        var cssRuleTarget = getCssRuleTarget(str_type, subid, thingindex);
        var priorEffect = "background-image: " + $(cssRuleTarget).css("background-image");
        var idx = priorEffect.indexOf(", linear-gradient");
        if ( idx !== -1 ) {
            priorEffect = priorEffect.substring(0,idx);
        }
        editEffect = priorEffect + editEffect;
        addCSSRule(cssRuleTarget, editEffect);
        event.stopPropagation;
    });

    $("#fontEffect").off('change');
    $("#fontEffect").on('change', function (event) {
        var subid = $("#subidTarget").html();
        var cssRuleTarget = getCssRuleTarget(str_type, subid, thingindex);
        var fontstyle = $(this).val();
        var fontstr = "";
        if ( fontstyle.startsWith("sans" ) ) {
            fontstr+= "font-family: \"Droid Sans\", Arial, Helvetica, sans-serif; ";
        } else if ( fontstyle.startsWith("serif" ) ) {
            fontstr+= "font-family: \"Raleway\", \"Times New Roman\", Times, serif; ";
        } else if ( fontstyle.startsWith("mono" ) ) {
            fontstr+= "font-family: Courier, monospace; ";
        } else {
            fontstr+= "font-family: \"Droid Sans\", Arial, Helvetica, sans-serif; ";
        }
        
        // handle italics
        if ( fontstyle.endsWith("i" ) ) {
            fontstr+= "font-style: italic; ";
        } else {
            fontstr+= "font-style: normal; ";
        }
        
        // handle bolding
        if ( fontstyle.endsWith("b") || fontstyle.endsWith("bi") ) {
            fontstr+= "font-weight: bold; ";
        } else {
            fontstr+= "font-weight: normal; ";
        }
        
        // alert("Changing font effect target= " + target + " to: "+fontstr);
        addCSSRule(cssRuleTarget, fontstr);
        event.stopPropagation;
    });
    
    // font size handling
    $("#editFont").off('change');
    $("#editFont").on('change', function (event) {
        var subid = $("#subidTarget").html();
        var cssRuleTarget = getCssRuleTarget(str_type, subid, thingindex);
        var fontsize = $(this).val();
        var fontstr= "font-size: " + fontsize;
        console.log("Changing font. Target= " + cssRuleTarget + " to: "+fontstr);
        addCSSRule(cssRuleTarget, fontstr);
        event.stopPropagation;
    });
    
    // font size handling
    $("#alignEffect").off('change', "input");
    $("#alignEffect").on('change', "input", function (event) {
        var subid = $("#subidTarget").html();
        var cssRuleTarget = getCssRuleTarget(str_type, subid, thingindex);
        var aligneffect = $(this).val();
        var fontstr= "text-align: " + aligneffect;
        console.log("Changing alignment. Target= " + cssRuleTarget + " to: "+fontstr);
        addCSSRule(cssRuleTarget, fontstr);
        event.stopPropagation;
    });
	
    // determine hiding of element
    $("#isHidden").off('change');
    $("#isHidden").on('change', function(event) {
        var strCaller = $($(event.target)).attr("target");
        var ischecked = $(event.target).prop("checked");
        if ( ischecked  ){
            addCSSRule("div.overlay."+str_type+" v_"+thingindex, "display: none;", true);
            addCSSRule(strCaller, "display: none;", true);
        } else {
            addCSSRule("div.overlay."+str_type+" v_"+thingindex, "display: " + defaultOverlay + ";", true);
            addCSSRule(strCaller, "display: " + defaultShow + ";", true);
        }
        event.stopPropagation;
    });	

    // set the initial invert check box
    if ( $(icontarget).css("filter") && $(icontarget).css("filter").startsWith("invert") ) {
        $("#invertIcon").prop("checked",true);
    } else {
        $("#invertIcon").prop("checked",false);
    }
    
    // set the initial icon none check box
    var isicon = $(icontarget).css("background-image");
    if ( isicon === "none") {
        $("#noIcon").prop("checked", true);
    } else {
        $("#noIcon").prop("checked", false);
    }
    
    // set the initial alignment
    var initalign = $(icontarget).css("text-align");
    if ( initalign === "center") {
        $("#aligncenter").prop("checked", true);
    } else if (initalign === "right") {
        $("#alignright").prop("checked", true);
    } else {
        $("#alignleft").prop("checked", true);
    }
    
    // set initial hidden status
    var ish1= $(icontarget).css("display");
    var ish2= $("div.overlay."+str_type+" v_"+thingindex).css("display");
    if ( ish1 === "none" || ish2 === "none") {
        $("#isHidden").prop("checked", true);
    } else {
        $("#isHidden").prop("checked", false);
        defaultShow = ish1;
        defaultOverlay = ish2;
    }
    
}
    
// main routine that sets the color of items
function updateColor(strCaller, cssRuleTarget, str_type, subid, thingindex, strColor) {
    
    if ( subid==="level" ) {
        cssRuleTarget = getCssRuleTarget(str_type, subid, thingindex); //  "div.overlay.level.v_" + thingindex;
        var sliderline = cssRuleTarget;
        if ( strCaller==="background" ) {
            addCSSRule(sliderline, "background-color: " + strColor + ";");		
        } else {
            var sliderbox= sliderline + " .ui-slider";
            addCSSRule(sliderbox, "background-color: " + strColor + ";");		
            addCSSRule(sliderbox, "color: " + strColor + ";");		
            var sliderbox2= sliderbox + " span.ui-slider-handle";
            addCSSRule(sliderbox2, "background-color: " + strColor + ";");		
            addCSSRule(sliderbox2, "color: " + strColor + ";");		
        }
        console.log("Slider color: caller= " + strCaller + " LineTarget= " + sliderline + " BoxTarget= "+ sliderbox);

    } else if ( strCaller==="background" ) {
        addCSSRule(cssRuleTarget, "background-color: " + strColor + ";");		
    } else {
        addCSSRule(cssRuleTarget, "color: " + strColor + ";");	
    }
}

function getIconCategories() {
	var iconDoc = 'iconlist.txt';
	var arrCat = ['Local_Storage','Local_Media'];
	$.ajax({
        url:iconDoc,
        type:'GET',
        success: function (data) {
            var arrIcons = data.toString().replace(/[\t\n]+/g,'').split(',');
            $.each(arrIcons, function(index, val) {
                var iconCategory = val.substr(0, val.indexOf('|'));
                iconCategory = $.trim(iconCategory).replace(/\s/g, '_');	
                arrCat.push(iconCategory);					
            }); //end each Icon
            arrCat = makeUnique(arrCat);
            $.each(arrCat, function(index, iconCat) {
                var catText = iconCat.replace(/_/g, ' ')
                $('#iconSrc').append($('<option></option>').val(iconCat).text(catText));
            }); 
        } //end function()
	}); //end ajax
}

function getIcons(str_type, thingindex) {
    getIconCategories();
    var iCategory = $("#iconSrc").val();
    var skindir = $("#skinid").val();
    var localPath = skindir + '/icons/';
    
    // change to use php to gather icons in an ajax post call
    // this replaces the old method that fails on GoDaddy
    if ( !iCategory ) { iCategory = 'Local_Storage'; }
    if( iCategory === 'Local_Storage' || iCategory==='Local_Media') {
        if ( iCategory === 'Local_Media') {
            localPath = skindir + '/media/';
        }
        $.post("getdir.php", 
            {useajax: "geticons", attr: localPath},
            function (presult, pstatus) {
                if (pstatus==="success" ) {
                    console.log("reading icons from local path= "+localPath);
                    $('#iconList').html(presult);
                    setupIcons(iCategory, str_type, thingindex);
                } else {
                    $('#iconList').html("<div class='error'>Error reading icons from local path= " + localPath + "</div>");
                }
            }
        );
    } else {
        var icons = '';
        var iconDoc = 'iconlist.txt';
        $.ajax({
            url:iconDoc,
            type:'GET',
            success: function (data) {
                var arrIcons = data.toString().replace(/[\t\n]+/g,'').split(',');
                $.each(arrIcons, function(index, val) {
                    var iconCategory = val.substr(0, val.indexOf('|'));
                    iconCategory = $.trim(iconCategory).replace(/\s/g, '_');	
                    if(iconCategory === iCategory) {
                        var iconPath = val.substr(1 + val.indexOf('|'));
                        iconPath = encodeURI(iconPath);
                        icons+='<div>';
                        icons+='<img class="icon" src="' + iconPath + '"></div>';
                    }
                }); //end each Icon			
                $('#iconList').html(icons);
                setupIcons(iCategory, str_type, thingindex);
            } //end function()
        }); //end ajax
    }
}

function makeUnique(list) {
    var result = [];
    $.each(list, function(i, e) {
        if ($.inArray(e, result) == -1) result.push(e);
    });
    return result;
}

function getBgEffect(effect) {
    var strEffect = '';
    if ( !effect ) {
        effect = $('#editEffect').val();
    }

    switch (effect) {
        case "hdark":
            strEffect = ', linear-gradient(to right, rgba(0,0,0,.5) 0%,rgba(0,0,0,0) 50%, rgba(0,0,0,.5) 100%)';
            break;
                
        case "hlight":
            strEffect = ', linear-gradient(to right, rgba(255,255,255,.4) 0%, rgba(255,255,255,0) 30%, rgba(255,255,255,0) 70%, rgba(255,255,255,.4) 100%)';
            break;
                
        case "vdark":
            strEffect = ', linear-gradient(to bottom, rgba(0,0,0,.5) 0%,rgba(0,0,0,0) 50%, rgba(0,0,0,.5) 100%)';
            break;
                
        case "vlight":
            strEffect = ', linear-gradient(to bottom, rgba(255,255,255,.4) 0%, rgba(255,255,255,0) 30%, rgba(255,255,255,0) 70%, rgba(255,255,255,.4) 100%)';
            break;
    };	
    return strEffect;
}

// main routine that sets the icon of things
function iconSelected(category, cssRuleTarget, imagePath, str_type, subid, thingindex) {
    $("#noIcon").prop('checked', false);
    var strEffect = getBgEffect();
    var imgurl = 'background-image: url("' + imagePath + '")';
    console.log("Setting icon: category= " + category + " target= " + cssRuleTarget + " icon= " + imagePath + " type= " + str_type + " index= " + thingindex + " rule= " + imgurl);
    addCSSRule(cssRuleTarget, imgurl + strEffect + ";");

    // set new icons to default size
    $("#autoBgSize").prop("checked", false);
    updateSize(str_type, subid, thingindex);
}

function updateSize(str_type, subid, thingindex) {
    var cssRuleTarget = getCssRuleTarget(str_type, subid, thingindex);
    
    if ( $("#autoBgSize").is(":checked") ) {
        $("#bgSize").prop("disabled", true);
        $("#bgSize").css("background-color","gray");
        addCSSRule(cssRuleTarget, "background-size: auto;");
        // addCSSRule(cssRuleTarget, "height: auto;");
    } else {
        $("#bgSize").prop("disabled", false);
        $("#bgSize").css("background-color","white");
        var iconsize = $("#bgSize").val();
        // var iconsize = 80; // $(cssRuleTarget).height();
        iconsize = parseInt( iconsize );
        if ( isNaN(iconsize) || iconsize <= 0 ) {
            iconsize = 80;
            if ( subid.startsWith("music") ) {
                iconsize = 40;
            }
        }
        var rule = iconsize.toString() + "px;";
        addCSSRule(cssRuleTarget, "background-size: " + rule);
        // addCSSRule(cssRuleTarget, "height: " + rule);
    }
}

function addCSSRule(selector, rules, resetFlag){
    //Searching of the selector matching cssRules
    // alert("Adding rules: " + rules);
    
    var sheet = document.getElementById('customtiles').sheet; // returns an Array-like StyleSheetList
    var index = -1;
    for(var i=sheet.cssRules.length; i--;){
        var current_style = sheet.cssRules[i];
        if(current_style.selectorText === selector){
            //Append the new rules to the current content of the cssRule;
            if( !resetFlag ){
                rules=current_style.style.cssText + rules;			
            }
            sheet.deleteRule(i);
            index=i;
        }
    }
    if(sheet.insertRule){
        if(index > -1) {
            sheet.insertRule(selector + "{" + rules + "}", index);		  
        } else {
            sheet.insertRule(selector + "{" + rules + "}");			  
        }
    }
    else{
        if(index > -1) {
            sheet.addRule(selector, rules, index);	  
        } else {
            sheet.addRule(selector, rules);	  
        }
    }
}

function resetCSSRules(str_type, subid, thingindex){

        var ruletypes = ['wholetile','head'];
        ruletypes.forEach( function(rule, idx, arr) {
            var subtarget = getCssRuleTarget(str_type, rule, thingindex);
            removeCSSRule(subtarget, thingindex, null, 0);
        });

        // remove all the subs
        var onoff = getOnOff(subid);
        if ( onoff && onoff.length ) {
            onoff.forEach( function(rule, idx, arr) {
                var subtarget = getCssRuleTarget(str_type, rule, thingindex);
                removeCSSRule(subtarget, thingindex, null, 0);
            })
        }
}

function removeCSSRule(strMatchSelector, thingindex, target, ignoreall){
    var scope = $("#scopeEffect").val();
    var useall = 0;
    
    if ( ignoreall ) {
        if ( ignoreall===0 || ignoreall===1 || ignoreall===2 ) {
            useall = ignoreall;
        }
    } else {
        if ( scope=== "alltypes") { useall= 1; }
        else if ( scope=== "alltiles") { useall= 2; }
        else { useall = 0; }
    }
    
    var sheet = document.getElementById('customtiles').sheet; // returns an Array-like StyleSheetList
    //Searching of the selector matching cssRules
    // console.log("Remove rule: " + strMatchSelector );
    for (var i=sheet.cssRules.length; i--;) {
        var current_style = sheet.cssRules[i];
        // alert(current_style.style.cssText );
//        console.log("Del: " + current_style.selectorText );
        if ( useall===2 || ( thingindex && current_style.selectorText.indexOf("_"+thingindex) !== -1 ) || 
             (current_style.selectorText === strMatchSelector &&
               ( !target || current_style.style.cssText.indexOf(target) !== -1 ) ) ) {
            sheet.deleteRule (i);
            console.log("Removing rule: " + current_style.selectorText);
        }
    }  
}
		 
function invertImage(){
    //Searching of the selector matching cssRules
    var selector = ".icon";
    var rules = "float: left;\nmargin: 2px;\nmax-height: 40px;\nobject-fit: contain;";
    var sheet = document.getElementById('tileeditor').sheet; // returns an Array-like StyleSheetList
    var index = -1;
    for(var i=sheet.cssRules.length; i--;){
        var current_style = sheet.cssRules[i];
        if (current_style.selectorText === selector) {
            //Append the new rules to the current content of the cssRule;
            sheet.deleteRule(i);
            index=i;
        }
    }
    
    if($("#invertIcon").is(':checked')) {
        rules = rules + "\nfilter: invert(1);\n-webkit-filter: invert(1);";
    }

    if (sheet.insertRule) {
        if (index > -1) {
            sheet.insertRule(selector + "{" + rules + "}", index);		  
        } else {
            sheet.insertRule(selector + "{" + rules + "}");			  
        }
    }
    else{
        if (index > -1) {
            sheet.addRule(selector, rules, index);	  
        } else {
            sheet.addRule(selector, rules);	  
        }
    }	
}
