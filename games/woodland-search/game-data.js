window.WOODLAND_SEARCH_DATA={
  characters:[
    {name:'Barnaby',image:'barnaby.png',special:true,clue:'Look for a little fox in a yellow sweater.',foundLine:'Barnaby gives a happy little wave. The path ahead feels brighter already.'},
    {name:'Pip',image:'pip.png',mischief:true,clue:'A small guardian friend is tucked somewhere into the scene.',foundLine:'Pip peeks out with a grin. That was a very careful bit of spotting.'},
    {name:'Willow',image:'willow.png',mischief:true,clue:'Willow is hiding among the woodland colours.',foundLine:'Willow was tucked away among the woodland colours. Lovely finding.'},
    {name:'Twinkle',image:'twinkle.png',clue:'Watch for someone tiny with a little touch of woodland sparkle.',foundLine:'Twinkle sparkles into view. A tiny bit of woodland magic found.'},
    {name:'the tiny frog',image:'tiny-green-frog.png',clue:'Look low down for a very small green friend.',foundLine:'The tiny frog gives the smallest proud croak in the whole forest.'},
    {name:'Mum',image:'mum.png',clue:'A warm russet fox is waiting quietly somewhere nearby.',foundLine:'Mum smiles warmly from her hiding place. Another path is complete.'},
    {name:'Mr Alder',image:'mr-alder.png',clue:'Look carefully for Mr Alder among the trees and lantern colours.',foundLine:'Mr Alder steps out from the trees with his quiet lantern glow.'},
    {name:'Mr Bramble',image:'mr-bramble.png',mischief:true,clue:'Mr Bramble has found himself a clever little hiding place.',foundLine:'Mr Bramble was watching the path all along. Brilliant searching.'},
    {name:'the Little Guardian',image:'little-guardian.png',clue:'A little guardian is hiding where the woodland feels most magical.',foundLine:'The Little Guardian appears with a soft golden shimmer.'},
    {name:'the Human Girl',image:'human-girl.png',clue:'A woodland visitor is waiting somewhere along the path.',foundLine:'You found the woodland visitor. She looks delighted to be discovered.'}
  ],

  scenes:[
    {
      image:'assets/whispering-woods-landscape-01.webp',
      name:'Golden Apple Clearing',
      shortName:'Apple',
      intro:'The first path opens beneath the golden leaves.',
      spots:[
        {x:13,y:69,hint:'Look near the roots on the left.'},
        {x:29,y:76,hint:'Try the ferns beside the path.'},
        {x:61,y:72,hint:'Search the flowers by the clearing.'},
        {x:79,y:72,hint:'Look around the mossy rocks.'},
        {x:73,y:52,hint:'Try the tree line beyond the path.'}
      ],
      seedSpots:[{x:46,y:64},{x:86,y:58},{x:38,y:79}],
      secretItem:{id:'golden-apple-charm',name:'Golden Apple Charm',image:'secrets/golden-apple-charm.png',spots:[{x:55,y:55},{x:20,y:61},{x:89,y:49}]}
    },
    {
      image:'assets/whispering-woods-landscape-02.webp',
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
      seedSpots:[{x:49,y:56},{x:22,y:61},{x:88,y:73}],
      secretItem:{id:'pool-stone',name:'Moonlit Pool Stone',image:'secrets/moonlit-pool-stone.png',spots:[{x:42,y:51},{x:68,y:62},{x:88,y:53}]}
    },
    {
      image:'assets/whispering-woods-landscape-03.webp',
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
      seedSpots:[{x:43,y:52},{x:63,y:80},{x:20,y:60}],
      secretItem:{id:'tiny-bell',name:'Tiny Woodland Bell',image:'secrets/tiny-woodland-bell.png',spots:[{x:33,y:57},{x:59,y:50},{x:77,y:61}]}
    },
    {
      image:'assets/whispering-woods-landscape-04.webp',
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
      seedSpots:[{x:46,y:58},{x:88,y:65},{x:24,y:82}],
      secretItem:{id:'sunflower-pin',name:'Sunflower Pin',image:'secrets/sunflower-pin.png',spots:[{x:18,y:58},{x:49,y:72},{x:82,y:56}]}
    },
    {
      image:'assets/whispering-woods-landscape-05.webp',
      name:'Lantern Village',
      shortName:'Village',
      intro:'The fifth path reaches the lantern village for one last search among the busy little paths.',
      spots:[
        {x:14,y:66,hint:'Try the flowers near the little cart.'},
        {x:31,y:72,hint:'Look beside the cobbled village path.'},
        {x:56,y:67,hint:'Search around the market flowers.'},
        {x:72,y:74,hint:'Look near the stones beside the stream.'},
        {x:83,y:61,hint:'Try the greenery near the water.'}
      ],
      seedSpots:[{x:45,y:59},{x:88,y:68},{x:21,y:78}],
      secretItem:{id:'lantern-key',name:'Little Lantern Key',image:'secrets/little-lantern-key.png',spots:[{x:39,y:49},{x:67,y:58},{x:84,y:78}]}
    },
    {
      image:'assets/whispering-woods-landscape-06.webp',
      name:'The Sunlit Path',
      shortName:'Sunlit',
      intro:'A bright woodland path winds onward through tall trees and sparkling water.',
      spots:[
        {x:16,y:67,hint:'Look where the path disappears behind the roots.'},
        {x:34,y:73,hint:'Try the flowers beside the stream.'},
        {x:55,y:65,hint:'Search the little bend in the trail.'},
        {x:72,y:74,hint:'Look near the bridge rail.'},
        {x:83,y:57,hint:'Try the sunlit trees on the right.'}
      ],
      seedSpots:[{x:27,y:55},{x:62,y:54},{x:89,y:70}],
      secretItem:{id:'map-feather',name:'Explorer Feather',image:'secrets/explorer-feather.png',spots:[{x:43,y:57},{x:73,y:47},{x:86,y:78}]}
    },
    {
      image:'assets/whispering-woods-landscape-07.webp',
      name:'The Old Woodland Trail',
      shortName:'Trail',
      intro:'Ancient trees lean over an older trail where the forest feels wonderfully deep.',
      spots:[
        {x:14,y:72,hint:'Search around the great tree roots on the left.'},
        {x:30,y:63,hint:'Look where the old trail bends.'},
        {x:52,y:75,hint:'Try the mossy stones beside the path.'},
        {x:70,y:64,hint:'Look beneath the hanging branches.'},
        {x:84,y:74,hint:'Search the flowers near the far edge.'}
      ],
      seedSpots:[{x:40,y:52},{x:63,y:58},{x:91,y:60}],
      secretItem:{id:'oak-leaf',name:'Old Oak Leaf',image:'secrets/old-oak-leaf.png',spots:[{x:24,y:54},{x:58,y:49},{x:78,y:79}]}
    },
    {
      image:'assets/whispering-woods-landscape-08.webp',
      name:'The Quiet Evening Woods',
      shortName:'Evening',
      intro:'Golden evening light settles over a quieter corner of the Whispering Woods.',
      spots:[
        {x:16,y:69,hint:'Look close to the warm tree trunks.'},
        {x:32,y:76,hint:'Try the soft grass beside the path.'},
        {x:55,y:72,hint:'Search near the little clearing.'},
        {x:72,y:58,hint:'Look beneath the evening branches.'},
        {x:84,y:72,hint:'Try the flowers near the stream.'}
      ],
      seedSpots:[{x:48,y:52},{x:77,y:54},{x:27,y:70}],
      secretItem:{id:'old-map',name:'Folded Woodland Map',image:'secrets/folded-woodland-map.png',spots:[{x:41,y:61},{x:67,y:76},{x:88,y:53}]}
    },
    {
      image:'assets/whispering-woods-landscape-09.webp',
      name:'Where the Meadow Opens',
      shortName:'Meadow',
      intro:'The trees open into a broad meadow with room to wander and notice tiny things.',
      spots:[
        {x:14,y:72,hint:'Look around the meadow edge on the left.'},
        {x:31,y:67,hint:'Try the flowers beside the little track.'},
        {x:53,y:74,hint:'Search near the open grass.'},
        {x:72,y:66,hint:'Look beside the distant trees.'},
        {x:85,y:74,hint:'Try the right-hand meadow flowers.'}
      ],
      seedSpots:[{x:43,y:55},{x:64,y:62},{x:88,y:58}],
      secretItem:{id:'blue-ribbon',name:'Woodland Ribbon',image:'secrets/woodland-ribbon.png',spots:[{x:24,y:60},{x:57,y:51},{x:81,y:61}]}
    },
    {
      image:'assets/whispering-woods-landscape-10.webp',
      name:'Winter Circus Clearing',
      shortName:'Circus',
      intro:'The final path opens into a magical snowy clearing where the travelling circus has left its lanterns glowing.',
      spots:[
        {x:16,y:69,hint:'Look beside the snowy signposts on the left.'},
        {x:33,y:76,hint:'Try the snow near the old caravan.'},
        {x:57,y:69,hint:'Search around the bright circus tent.'},
        {x:75,y:73,hint:'Look beside the little bridge.'},
        {x:84,y:57,hint:'Try the snowy pines beyond the lights.'}
      ],
      seedSpots:[{x:44,y:59},{x:68,y:55},{x:88,y:69}],
      secretItem:{id:'circus-ticket',name:'Golden Circus Ticket',image:'secrets/golden-circus-ticket.png',spots:[{x:25,y:57},{x:59,y:53},{x:82,y:66}]}
    }
  ]
};
