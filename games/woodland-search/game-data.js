window.WOODLAND_SEARCH_DATA={
  characters:[
    {name:'Pip',image:'pip.png'},
    {name:'Barnaby',image:'barnaby.png'},
    {name:'Willow',image:'willow.png'},
    {name:'Twinkle',image:'twinkle.png'},
    {name:'the tiny frog',image:'tiny-green-frog.png'},
    {name:'Mum',image:'mum.png'},
    {name:'Mr Alder',image:'mr-alder.png'},
    {name:'Mr Bramble',image:'mr-bramble.png'},
    {name:'the Little Guardian',image:'little-guardian.png'},
    {name:'the Human Girl',image:'human-girl.png'}
  ],

  /*
    Spots are deliberately kept away from every screen edge and from the HUD
    zones used on desktop / phone landscape. x/y mark the character's feet.
    Each clue points to real scenery instead of revealing the answer outright.
  */
  scenes:[
    {
      image:'village.png',
      name:'The lantern village',
      spots:[
        {x:14,y:66,hint:'Try the flowers near the little cart.'},
        {x:31,y:72,hint:'Look beside the cobbled village path.'},
        {x:56,y:67,hint:'Search around the market flowers.'},
        {x:72,y:74,hint:'Look near the stones beside the stream.'},
        {x:83,y:61,hint:'Try the greenery near the water.'}
      ]
    },
    {
      image:'woods-1.webp',
      name:'The golden apple clearing',
      spots:[
        {x:13,y:69,hint:'Look near the roots on the left.'},
        {x:29,y:76,hint:'Try the ferns beside the path.'},
        {x:61,y:72,hint:'Search the flowers by the clearing.'},
        {x:79,y:72,hint:'Look around the mossy rocks.'},
        {x:73,y:52,hint:'Try the tree line beyond the path.'}
      ]
    },
    {
      image:'woods-2.webp',
      name:'The glowing woodland pool',
      spots:[
        {x:14,y:68,hint:'Look near the little round doorway.'},
        {x:31,y:75,hint:'Try the moss beside the path.'},
        {x:59,y:73,hint:'Search along the glowing pool edge.'},
        {x:81,y:67,hint:'Look near the roots on the right.'},
        {x:72,y:53,hint:'Try the ancient tree beside the pool.'}
      ]
    },
    {
      image:'woods-3.webp',
      name:'The little stream',
      spots:[
        {x:14,y:77,hint:'Try the mushrooms on the left bank.'},
        {x:29,y:71,hint:'Look beside the rocks near the water.'},
        {x:52,y:69,hint:'Search the stones in the little stream.'},
        {x:71,y:68,hint:'Look around the big riverside rock.'},
        {x:82,y:76,hint:'Try the flowers on the right bank.'}
      ]
    },
    {
      image:'woods-4.webp',
      name:'The sunflower valley',
      spots:[
        {x:14,y:73,hint:'Look near the bicycle and sunflowers.'},
        {x:30,y:67,hint:'Try the flowers beside the winding path.'},
        {x:58,y:73,hint:'Search around the old wooden fence.'},
        {x:79,y:72,hint:'Look among the flowers on the right.'},
        {x:70,y:53,hint:'Try the hillside near the little bridge.'}
      ]
    }
  ]
};
