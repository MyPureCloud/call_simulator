Notes List
----------
- Doesn't seem to work when not on the same network.  i.e. if I am at home on the VPN and i try to contact my edge, the messages aren't being routed properly.


TODO Feature List
-----------------
- Register Stations
-- Specify a list of station names
- Place calls into edge server
-- configure number of calls, duration, destination
- Receive Calls  
-- Hard code the destinations 2222222@sim = valid call, 3333333@sim = busy


Extra features
--------------
The extra features will tie into your PureCloud org to provide for better coupling between services
- Pull stations from PureCloud that match a specific regex and register as those stations
- Use PureCloud Lookups to select the destination of the call from the server
- find a way to deploy to virtual edge, maybe with https://github.com/jaredallard/nexe
