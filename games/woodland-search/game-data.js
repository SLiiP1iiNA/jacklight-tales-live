window.WOODLAND_SEARCH_DATA={
  characters:[
    {name:'Barnaby',image:'barnaby.png',special:true,clue:'Look for a little fox in a yellow sweater.',foundLine:'Barnaby gives a happy little wave. The path ahead feels brighter already.'},
    {name:'Pip',image:'pip.png',special:true,clue:'A small guardian friend is tucked somewhere into the scene.',foundLine:'Pip peeks out with a grin. That was a very careful bit of spotting.'},
    {name:'Willow',image:'willow.png',clue:'Willow is hiding among the woodland colours.',foundLine:'Willow was tucked away among the woodland colours. Lovely finding.'},
    {name:'Twinkle',image:'twinkle.png',clue:'Watch for someone tiny with a little touch of woodland sparkle.',foundLine:'Twinkle sparkles into view. A tiny bit of woodland magic found.'},
    {name:'the tiny frog',image:'tiny-green-frog.png',clue:'Look low down for a very small green friend.',foundLine:'The tiny frog gives the smallest proud croak in the whole forest.'},
    {name:'Mum',image:'mum.png',clue:'A warm russet fox is waiting quietly somewhere nearby.',foundLine:'Mum smiles warmly from her hiding place. Another path is complete.'},
    {name:'Mr Alder',image:'mr-alder.png',clue:'Look carefully for Mr Alder among the trees and lantern colours.',foundLine:'Mr Alder steps out from the trees with his quiet lantern glow.'},
    {name:'Mr Bramble',image:'mr-bramble.png',clue:'Mr Bramble has found himself a clever little hiding place.',foundLine:'Mr Bramble was watching the path all along. Brilliant searching.'},
    {name:'the Little Guardian',image:'little-guardian.png',clue:'A little guardian is hiding where the woodland feels most magical.',foundLine:'The Little Guardian appears with a soft golden shimmer.'},
    {name:'the Human Girl',image:'human-girl.png',clue:'A woodland visitor is waiting somewhere along the path.',foundLine:'You found the woodland visitor. She looks delighted to be discovered.'}
  ],

  scenes:[
    {
      image:'woods-1.webp',
      name:'Golden Apple Clearing',
      shortName:'Clearing',
      intro:'The first path opens beneath the golden leaves.',
      spots:[
        {x:13,y:69,hint:'Look near the roots on the left.'},
        {x:29,y:76,hint:'Try the ferns beside the path.'},
        {x:61,y:72,hint:'Search the flowers by the clearing.'},
        {x:79,y:72,hint:'Look around the mossy rocks.'},
        {x:73,y:52,hint:'Try the tree line beyond the path.'}
      ],
      seedSpots:[{x:46,y:64},{x:86,y:58},{x:38,y:79}]
    },
    {
      image:'woods-2.webp',
      name:'Glowing Woodland Pool',
      shortName:'Pool',
      intro:'The path bends toward a glowing pool crowded with roots and little lights.',
      spots:[
        {x:14,y:68,hint:'Look near the little round doorway.'},
        {x:31,y:75,hint:'Try the moss beside the path.'},
        {x:59,y:73,hint:'Search along the glowing pool edge.'},
        {x:81,y:67,hint:'Look near the roots on the right.'},
        {x:72,y:53,hint:'Try the ancient tree beside the pool.'}
      ],
      seedSpots:[{x:49,y:56},{x:22,y:61},{x:88,y:73}]
    },
    {
      image:'woods-3.webp',
      name:'Little Stream',
      shortName:'Stream',
      intro:'Water chatters over the stones on the third woodland path.',
      spots:[
        {x:14,y:77,hint:'Try the mushrooms on the left bank.'},
        {x:29,y:71,hint:'Look beside the rocks near the water.'},
        {x:52,y:69,hint:'Search the stones in the little stream.'},
        {x:71,y:68,hint:'Look around the big riverside rock.'},
        {x:82,y:76,hint:'Try the flowers on the right bank.'}
      ],
      seedSpots:[{x:43,y:52},{x:63,y:80},{x:20,y:60}]
    },
    {
      image:'woods-4.webp',
      name:'Sunflower Valley',
      shortName:'Valley',
      intro:'The fourth path opens into a bright valley of flowers, fences and winding tracks.',
      spots:[
        {x:14,y:73,hint:'Look near the bicycle and sunflowers.'},
        {x:30,y:67,hint:'Try the flowers beside the winding path.'},
        {x:58,y:73,hint:'Search around the old wooden fence.'},
        {x:79,y:72,hint:'Look among the flowers on the right.'},
        {x:70,y:53,hint:'Try the hillside near the little bridge.'}
      ],
      seedSpots:[{x:46,y:58},{x:88,y:65},{x:24,y:82}]
    },
    {
      image:'village.png',
      name:'Lantern Village',
      shortName:'Village',
      intro:'The final path reaches the lantern village for one last search.',
      spots:[
        {x:14,y:66,hint:'Try the flowers near the little cart.'},
        {x:31,y:72,hint:'Look beside the cobbled village path.'},
        {x:56,y:67,hint:'Search around the market flowers.'},
        {x:72,y:74,hint:'Look near the stones beside the stream.'},
        {x:83,y:61,hint:'Try the greenery near the water.'}
      ],
      seedSpots:[{x:45,y:59},{x:88,y:68},{x:21,y:78}]
    }
  ]
};