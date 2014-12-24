var canvas;
var delta = [ 0, 0 ];
var stage = [ window.screenX, window.screenY, window.innerWidth, window.innerHeight ];
getBrowserDimensions();


var themes = [ [ "#10222B", "#95AB63", "#BDD684", "#E2F0D6", "#F6FFE0" ],
    [ "#362C2A", "#732420", "#BF734C", "#FAD9A0", "#736859" ],
    [ "#0D1114", "#102C2E", "#695F4C", "#EBBC5E", "#FFFBB8" ],
    [ "#2E2F38", "#FFD63E", "#FFB54B", "#E88638", "#8A221C" ],
    [ "#121212", "#E6F2DA", "#C9F24B", "#4D7B85", "#23383D" ],
    [ "#343F40", "#736751", "#F2D7B6", "#BFAC95", "#8C3F3F" ],
    [ "#000000", "#2D2B2A", "#561812", "#B81111", "#FFFFFF" ],
    [ "#333B3A", "#B4BD51", "#543B38", "#61594D", "#B8925A" ] ];


// 絵文字取得
var emojis = getEmojis();
var emoji_kind;

var theme;
var worldAABB, world, iterations = 1, timeStep = 1 / 15;
var walls = [];
var wall_thickness = 200;
var wallsSetted = false;

var bodies, elements, text;
var createMode = false;
var destroyMode = false;
var isMouseDown = false;
var mouseJoint;
var mouse = { x: 0, y: 0 };
var gravity = { x: 0, y: 1 };
var PI2 = Math.PI * 2;
var timeOfLastTouch = 0;


$(document).ready(function(){

    init();
    play();

    $('a').on('click', function(){

        var kind;
        if(kind = this.name.match(/\d+/)[0]){
            emoji_kind = kind;
            createBall( mouse.x, mouse.y );
            reload();
        }
    });
});

function init() {

    canvas = document.getElementById( 'canvas' );
    document.onmousedown = onDocumentMouseDown;
    document.onmouseup = onDocumentMouseUp;
    document.onmousemove = onDocumentMouseMove;
    document.ondblclick = onDocumentDoubleClick;
    document.addEventListener( 'touchstart', onDocumentTouchStart, false );
    document.addEventListener( 'touchmove', onDocumentTouchMove, false );
    document.addEventListener( 'touchend', onDocumentTouchEnd, false );
    window.addEventListener( 'deviceorientation', onWindowDeviceOrientation, false );

    // init box2d エンジン初期化
    worldAABB = new b2AABB();
    // 物理計算が行われる範囲
    worldAABB.minVertex.Set( -200, -200 );
    worldAABB.maxVertex.Set( window.innerWidth + 200, window.innerHeight + 200 );

    // 重力ベクトル
    var grav = new b2Vec2(0, 0);
    // 動きが止まった物体の計算を省略するかどうか
    var doSleep = true;
    world = new b2World( worldAABB, grav, doSleep );
    setWalls();
    reset();
}


function play() {
    setInterval( loop, 1000 / 40 );
}

function reset() {

    var i;

    if ( bodies ) {

        for ( i = 0; i < bodies.length; i++ ) {

            var body = bodies[ i ];
            canvas.removeChild( body.GetUserData().element );
            world.DestroyBody( body );
            body = null;
        }
    }

    // color theme
    theme = themes[ Math.random() * themes.length >> 0 ];
    document.body.style[ 'backgroundColor' ] = theme[ 0 ];

    bodies = [];
    elements = [];

    createInstructions();

    // 5個絵文字作成
    for( i = 0; i < 5; i++ ) {
        createBall();
    }

    // 絵文字リロード
    reload();
}

//

function onDocumentMouseDown() {

    isMouseDown = true;
    return false;
}

function onDocumentMouseUp() {

    isMouseDown = false;
    return false;
}

function onDocumentMouseMove( event ) {

    mouse.x = event.clientX;
    mouse.y = event.clientY;
}

function onDocumentDoubleClick() {

    reset();
}

function onDocumentTouchStart( event ) {

    if( event.touches.length == 1 ) {

        event.preventDefault();

        // Faking double click for touch devices
        var now = new Date().getTime();

        if ( now - timeOfLastTouch  < 250 ) {

            reset();
            return;
        }

        timeOfLastTouch = now;

        mouse.x = event.touches[ 0 ].pageX;
        mouse.y = event.touches[ 0 ].pageY;
        isMouseDown = true;
    }
}

function onDocumentTouchMove( event ) {

    if ( event.touches.length == 1 ) {

        event.preventDefault();
        mouse.x = event.touches[ 0 ].pageX;
        mouse.y = event.touches[ 0 ].pageY;

    }

}

function onDocumentTouchEnd( event ) {

    if ( event.touches.length == 0 ) {

        event.preventDefault();
        isMouseDown = false;
    }
}

function onWindowDeviceOrientation( event ) {

    if ( event.beta ) {

        gravity.x = Math.sin( event.gamma * Math.PI / 180 );
        gravity.y = Math.sin( ( Math.PI / 4 ) + event.beta * Math.PI / 180 );
    }
}

// インストラクションのボール

function createInstructions() {


    var size = 350;
    var element = document.createElement( 'div' );
    element.width = size;
    element.height = size;
    element.style.position = 'absolute';
    element.style.left = -300 + 'px';
    element.style.top = -300 + 'px';
    element.style.cursor = "default";

    canvas.appendChild(element);
    elements.push( element );

    // 表示用コンテキストを取得
    var circle = document.createElement( 'canvas' );
    circle.width = size;
    circle.height = size;

    var graphics = circle.getContext( '2d' );

    graphics.fillStyle = "#228b22";
    graphics.beginPath();
    graphics.arc( size * .5, size * .5, size * .5, 0, PI2, true );
    graphics.closePath();
//    graphics.drawImage(presentImg,100,100);
    graphics.fill();
    element.appendChild( circle );

    text = document.createElement( 'div' );
    text.onSelectStart = null;
	text.innerHTML =
        '<span style="font-size:40px;" class="xmas-red">' +
            '🎅🐷🍺😜🎁'+
            '<br />' +
            'Merry ' +'Xmas!' +
            '</span>' +
            '<br />' +
            '<a href="javascript:void(0);" name="emoji_kind0">顔、感情</a>  ' +
            '<a href="javascript:void(0);" name="emoji_kind1">動物,自然</a>  <br />' +
            '<a href="javascript:void(0);" name="emoji_kind2">季節、小物、食べ物</a>  ' +
            '<a href="javascript:void(0);" name="emoji_kind3">建物、乗り物、国旗</a>  <br />' +
            '<a href="javascript:void(0);" name="emoji_kind4">数字、記号</a>' +
            '<br />' +
            '<span style="font-size:15px;">' +
            '<br />' +
            'いろいろドラッグ、クリックしてみてね' +
            '<br/>' +
            'ブラウザをシェイクしてみてね' +
            '<br/>' +
            'ダブルタップでもう一度！' +
            '<br />' +
            '<div class="fb-like" data-href="http://manchan.github.io/emoji-flood/" data-layout="button_count" data-action="like" data-show-faces="true" data-share="true"></div>' +
            '<a href="https://twitter.com/share" class="twitter-share-button"  data-url="http://manchan.github.io/emoji-flood/" data-text="Emoji Flood" data-via="you_matz" data-lang="ja" data-count="none" data-hashtags="EmojiFlood">Tweet Button</a>';
    text.style.color = theme[1];
    text.style.position = 'absolute';
    text.style.left = '0px';
    text.style.top = '0px';
    text.style.fontFamily = 'Georgia';
    text.style.textAlign = 'center';
    element.appendChild(text);

    text.style.left = ((350 - text.clientWidth) / 2) +'px';
    text.style.top = ((350 - text.clientHeight) / 2) +'px';

    var b2body = new b2BodyDef();

    var circle = new b2CircleDef();
    circle.radius = size / 2;
    circle.density = 1;
    circle.friction = 0.3;
    circle.restitution = 0.3;
    b2body.AddShape(circle);
    b2body.userData = {element: element};

    b2body.position.Set( Math.random() * stage[2], Math.random() * -200 );
    b2body.linearVelocity.Set( Math.random() * 400 - 200, Math.random() * 400 - 200 );
    bodies.push( world.CreateBody(b2body) );
}

function createBall( x, y ) {

    var x = x || Math.random() * stage[2];
    var y = y || Math.random() * -200;

    // 固定
    var size = 40;
    var element = document.createElement( 'div' );

    element.width = size;
    element.height = size;
    element.style.position = 'absolute';
    element.style.left = -200 + 'px';
    element.style.top = -200 + 'px';
    element.style.cursor = "default";

    canvas.appendChild(element);
    elements.push( element );

    var circle = document.createElement( 'canvas' );
    circle.width = size;
    circle.height = size;
    circle.style.position = 'absolute';
    circle.style.left = -200 + 'px';
    circle.style.top = -200 + 'px';
    circle.style.WebkitTransform = 'translateZ(0)';
    circle.style.MozTransform = 'translateZ(0)';
    circle.style.OTransform = 'translateZ(0)';
    circle.style.msTransform = 'translateZ(0)';
    circle.style.transform = 'translateZ(0)';

    var graphics = circle.getContext( '2d' );
    var one_emoji;

    if(!emoji_kind){
        var kind = Math.random() * emojis.length >> 0;
        one_emoji = emojis[kind][Math.random() * emojis[kind].length >> 0];
    }
    else{
        one_emoji = emojis[emoji_kind][Math.random() * emojis[emoji_kind].length >> 0];
    }

    text = document.createElement( 'div' );
    text.onSelectStart = null;
    text.innerHTML = '<span style="color:' + theme[0] + ';font-size:40px;">'
        + one_emoji + '</span>';

    element.appendChild(text);

//    text.style.left = ((250 - text.clientWidth) / 2) +'px';
//    text.style.top = ((250 - text.clientHeight) / 2) +'px';

    var b2body = new b2BodyDef();
    var circle = new b2CircleDef();
    circle.radius = size >> 1;
    circle.density = 1;
    circle.friction = 0.3;
    circle.restitution = 0.3;
    b2body.AddShape(circle);
    b2body.userData = {element: element};
    b2body.position.Set( x, y );
    b2body.linearVelocity.Set( Math.random() * 400 - 200, Math.random() * 400 - 200 );
    bodies.push( world.CreateBody(b2body) );
}

//

function loop() {

    if (getBrowserDimensions()) {
        setWalls();
    }

    delta[0] += (0 - delta[0]) * .5;
    delta[1] += (0 - delta[1]) * .5;

    world.m_gravity.x = gravity.x * 350 + delta[0];
    world.m_gravity.y = gravity.y * 350 + delta[1];

    mouseDrag();
    // 物体を次の位置へ移動
    world.Step(timeStep, iterations);

    for (i = 0; i < bodies.length; i++) {

        var body = bodies[i];
        var element = elements[i];

        element.style.left = (body.m_position0.x - (element.width >> 1)) + 'px';
        element.style.top = (body.m_position0.y - (element.height >> 1)) + 'px';

        if (element.tagName == 'DIV') {

            var style = 'rotate(' + (body.m_rotation0 * 57.2957795) + 'deg) translateZ(0)';
            text.style.WebkitTransform = style;
            text.style.MozTransform = style;
            text.style.OTransform = style;
            text.style.msTransform = style;
            text.style.transform = style;
        }
    }
}


// .. BOX2D UTILS

function createBox(world, x, y, width, height, fixed) {

    if (typeof(fixed) == 'undefined') {

        fixed = true;

    }
    // 図形を定義してエンジンに追加
    var boxSd = new b2BoxDef();

    if (!fixed) {
        boxSd.density = 1.0;
    }

    boxSd.extents.Set(width, height);

    var boxBd = new b2BodyDef();
    boxBd.AddShape(boxSd);
    boxBd.position.Set(x,y);

    return world.CreateBody(boxBd);

}

function mouseDrag()
{
    // mouse press
    if (createMode) {

        createBall( mouse.x, mouse.y );
        reload();

    } else if (isMouseDown && !mouseJoint) {

        var body = getBodyAtMouse();

        if (body) {

            var md = new b2MouseJointDef();
            md.body1 = world.m_groundBody;
            md.body2 = body;
            md.target.Set(mouse.x, mouse.y);
            md.maxForce = 30000 * body.m_mass;
            // md.timeStep = timeStep;
            mouseJoint = world.CreateJoint(md);
            body.WakeUp();

        } else {

            createMode = true;
        }
    }

    // mouse release
    if (!isMouseDown) {

        createMode = false;
        destroyMode = false;

        if (mouseJoint) {
            world.DestroyJoint(mouseJoint);
            mouseJoint = null;
        }
    }

    // mouse move
    if (mouseJoint) {

        var p2 = new b2Vec2(mouse.x, mouse.y);
        mouseJoint.SetTarget(p2);
    }
}

function getBodyAtMouse() {

    // Make a small box.
    var mousePVec = new b2Vec2();
    mousePVec.Set(mouse.x, mouse.y);

    var aabb = new b2AABB();
    aabb.minVertex.Set(mouse.x - 1, mouse.y - 1);
    aabb.maxVertex.Set(mouse.x + 1, mouse.y + 1);

    // Query the world for overlapping shapes.
    var k_maxCount = 10;
    var shapes = new Array();
    var count = world.Query(aabb, shapes, k_maxCount);
    var body = null;

    for (var i = 0; i < count; ++i) {

        if (shapes[i].m_body.IsStatic() == false) {

            if ( shapes[i].TestPoint(mousePVec) ) {

                body = shapes[i].m_body;
                break;
            }
        }
    }

    return body;

}

function setWalls() {

    if (wallsSetted) {

        world.DestroyBody(walls[0]);
        world.DestroyBody(walls[1]);
        world.DestroyBody(walls[2]);
        world.DestroyBody(walls[3]);

        walls[0] = null;
        walls[1] = null;
        walls[2] = null;
        walls[3] = null;
    }

    walls[0] = createBox(world, stage[2] / 2, - wall_thickness, stage[2], wall_thickness);
    walls[1] = createBox(world, stage[2] / 2, stage[3] + wall_thickness, stage[2], wall_thickness);
    walls[2] = createBox(world, - wall_thickness, stage[3] / 2, wall_thickness, stage[3]);
    walls[3] = createBox(world, stage[2] + wall_thickness, stage[3] / 2, wall_thickness, stage[3]);

    wallsSetted = true;

}

// BROWSER DIMENSIONS

function getBrowserDimensions() {

    var changed = false;

    if (stage[0] != window.screenX) {

        delta[0] = (window.screenX - stage[0]) * 50;
        stage[0] = window.screenX;
        changed = true;

    }

    if (stage[1] != window.screenY) {

        delta[1] = (window.screenY - stage[1]) * 50;
        stage[1] = window.screenY;
        changed = true;

    }

    if (stage[2] != window.innerWidth) {

        stage[2] = window.innerWidth;
        changed = true;

    }

    if (stage[3] != window.innerHeight) {

        stage[3] = window.innerHeight;
        changed = true;

    }

    return changed;
}


function twemojiGet(){

    var xhr = new XMLHttpRequest();
    var url = "js/twemoji.min.js";
    xhr.open("GET" , url, true);
    xhr.onreadystatechange = processResult;
    xhr.send(null);

    function processResult(){

        if(xhr.readyState == 4) {
            if(xhr.status == 200 || xhr.status == 201) {
                // 絵文字表示
                twemoji.parse(document.body);
            } else {
//                console.log("Network Error");
//                alert("Network Error");
            }
        }
    }
}

function reload(){
    twemojiGet();
}


