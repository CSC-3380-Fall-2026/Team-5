import React from 'react';
import {render, screen, act} from '@testing-library/react-native';
import CapsuleDetailsScreen from '../src/screens/CapsuleDetailsScreen';
import {loadCapsuleMemories} from '../src/services/memories';

jest.mock('@react-navigation/native',()=>({useFocusEffect:(callback:()=>void)=>{require('react').useEffect(callback,[callback]);}}));
jest.mock('react-native-safe-area-context',()=>({SafeAreaView:require('react-native').View}));
jest.mock('../src/services/memories',()=>({loadCapsuleMemories:jest.fn()}));
jest.mock('../src/services/authStorage',()=>({getAuthToken:async()=>'test-token'}));
const mockCapsule={id:'1',name:'Trip',unlockDate:'2020-01-01',friends:[],memories:[],memoryCount:1};
jest.mock('../src/context/CapsuleContext',()=>({useCapsules:()=>({capsules:[mockCapsule],reload:jest.fn()})}));
const memory={id:'m1',text:'A memory that must survive',photoUri:'data:image/png;base64,YQ=='};

afterEach(()=>{jest.useRealTimers();jest.clearAllMocks();});
test('details still show the saved memory after a capsule-list reset and subsequent reload',async()=>{
 jest.useFakeTimers();
 (loadCapsuleMemories as jest.Mock).mockResolvedValue({locked:false,memories:[memory]});
 const props={route:{params:{capsule:mockCapsule,memoryId:'m1'}},navigation:{navigate:jest.fn()}};
 const view=await render(<CapsuleDetailsScreen {...props}/>);
 expect(await screen.findByText(memory.text)).toBeTruthy();
 mockCapsule.memories=[];
 await view.rerender(<CapsuleDetailsScreen {...props}/>);
 await act(async()=>{jest.advanceTimersByTime(15000);});
 expect(screen.getByText(memory.text)).toBeTruthy();
 expect(screen.getByText('SELECTED MAP MEMORY')).toBeTruthy();
 expect(loadCapsuleMemories).toHaveBeenCalledTimes(2);
 await view.unmount();
});
