import vm from 'node:vm';
import {
  buildMemoryMapHTML,
  validCoordinates,
} from '../src/utils/memoryMap';
const memory = {
  id: 'm1',
  capsuleId: 'c1',
  capsuleName: 'Weekend',
  opensAt: '2020-01-01',
  text: 'A memory',
  photoUri: 'data:image/png;base64,aGVsbG8=',
  latitude: 0,
  longitude: -91,
  locationName: 'Park',
};
function run(memories, picking = false) {
  const messages = [];
  const markers = [];
  const handlers = {};
  const makeNode = (tag) => ({
    tag,
    children: [],
    textContent: '',
    appendChild(child) {
      this.children.push(child);
    },
  });
  const map = {
    setView() {
      return this;
    },
    on(name, fn) {
      handlers[name] = fn;
    },
    fitBounds: jest.fn(),
  };
  const L = {
    map: () => map,
    tileLayer: () => ({ addTo: () => ({ on: () => {} }) }),
    marker: (coords) => {
      const marker = {
        coords,
        addTo() {
          markers.push(this);
          return this;
        },
        bindPopup(node) {
          this.popup = node;
        },
        setLatLng(p) {
          this.coords = p;
        },
        on(name, fn) {
          this[name] = fn;
        },
        getLatLng() {
          return { lat: this.coords[0], lng: this.coords[1] };
        },
      };
      return marker;
    },
  };
  const html = buildMemoryMapHTML(memories, picking);
  const script = html.slice(
    html.lastIndexOf('<script>') + 8,
    html.lastIndexOf('</script>'),
  );
  vm.runInNewContext(script, {
    L,
    document: {
      createElement: makeNode,
      getElementById: () => makeNode('error'),
    },
    window: {
      ReactNativeWebView: {
        postMessage: (value) => messages.push(JSON.parse(value)),
      },
    },
  });
  return { html, markers, handlers, messages };
}
test('zero/negative coordinates remain valid and missing values never become zero', () => {
  expect(validCoordinates(memory)).toBe(true);
  expect(validCoordinates({ latitude: null, longitude: 0 })).toBe(false);
  expect(validCoordinates({ latitude: NaN, longitude: 0 })).toBe(false);
});
test('photo popup links to exact memory; colocated memories stay accessible', () => {
  const { markers, messages } = run([memory, { ...memory, id: 'm2' }]);
  expect(markers).toHaveLength(1);
  const sections = markers[0].popup.children;
  expect(sections).toHaveLength(2);
  expect(sections[0].children.find((n) => n.tag === 'img').src).toBe(
    memory.photoUri,
  );
  sections[1].children.find((n) => n.tag === 'button').onclick();
  expect(messages).toEqual([{ type: 'open', id: 'm2' }]);
});
test('script-breaking memory text stays plain text', () => {
  const text = '</script><script>throw new Error("injected")</script>';
  const result = run([{ ...memory, text }]);
  expect(result.html).not.toContain(text);
  expect(
    result.markers[0].popup.children[0].children.find((n) => n.tag === 'p')
      .textContent,
  ).toBe(text);
});
test('tap and drag emit valid coordinates including wrapped longitudes', () => {
  const { handlers, messages, markers } = run([], true);
  handlers.click({ latlng: { lat: 30, lng: 190 } });
  expect(messages[0]).toEqual({
    type: 'location',
    latitude: 30,
    longitude: -170,
  });
  markers[0].coords = [0, -90];
  markers[0].dragend();
  expect(messages[1]).toEqual({
    type: 'location',
    latitude: 0,
    longitude: -90,
  });
});
