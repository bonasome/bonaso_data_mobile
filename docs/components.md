# BONASO Data Portal Website Components

---

For consistency and maintenance, some components are shared across numerous pages. Below is a brief description of the use case for each of these.

---

# Contents
- Forms
- Inputs

---

## Forms
This site mostly uses React Hook Forms for collecting information from users. To help ease this process, there are two custom form components:

- Field ([components/forms/Field.jsx]): Takes a variety of inputs (such as label, options, IndexComponent, rules, name, etc.) depending on the type of input (see below) and returns an object the user can interact with. The only component that should reference field is FormSection, which should be used to build sets of fields. 
**Note**: A field will accept certain props that depend on the type of input:
    - name (string, required for all)
    - label (string, required for all), what will be displayed to the user
    - rules (object, optional), validation rules (required, email, etc.), passes errors to error prop of input component
    - options (array, MultiCheckbox/Num, RadioButtons, Picker), the option label and value

- FormSection ([components/forms/FormSection.jsx]): Combines a variety of forms into one section that can be displayed or hidden based on watches. Can also optionally be given a header. Meant to be used alongside field.

---

## Inputs
Inputs should always be wrapped in our reusable components rather than raw HTML <input>/<select> unless explicitly noted.

- Checkbox ([components/inputs/Checkbox.tsx]): A single toggle checkbox with a custom icon that returns a boolean.
```jsx
<Checkbox name="isActive" label="Active?" value={state} onChange={(v) => setState(v)} /> //onChange: boolean (true when checked, false when unchecked)
```

- MultiCheckbox ([components/inputs/MultiCheckbox.tsx]): A list of checkboxes that return information as an array.
```jsx
<MultiCheckbox name="kp_status" label="KP Status" options={[{value: 1, label: 'Option1'}, {value: 2, label: 'Option2'}]} value={state} onChange={(v) => setState(v)} /> //onChange: array of values
```

- MultiCheckboxNum ([components/inputs/MultiCheckboxNum.tsx]): A list of checkboxes that conditionally show a numeric input if checked. Returns an array of objects with data about the checked item and the number entered. Specifically designed for interactions that need a subcategory and a number, but possibly expandable. 
```jsx
<MultiCheckboxNum name="condoms" label="Condoms Received" options={[{id: 1, name: 'Option1'}, {id: 2, name: 'Option2'}]} value={state} onChange={(v) => setState(v)} /> 
//when check an input will appear allowing the user to type a number associated with that selected option
//onChange: returns an array of objects [{id: null, subcategory: {id: 1}, numeric_component: 3}]
```

- RadioButtons ([components/inputs/RadioButtons.tsx]): A custom radio button component with custom icons that allows a user to select a single option.
```jsx
<RadioButtons name="sex" label="Sex" options={[{value: 1, label: 'Option1'}, {value: 2, label: 'Option2'}]} value={state} onChange={(v) => setState(v)} /> //onChange: returns selected value
```

- SimplePicker ([components/inputs/SimplePicker.tsx]): A pop up picker that can select a single item. Radio buttons are generally preferred, except for longer lists, where this becomes appropriate. 
```jsx
<SimplePicker name="age_range" label="Age Range" options={[{value: 1, label: 'Option1'}, {value: 2, label: 'Option2'}]} value={state} onChange={(v) => setState(v)} /> //onChange: returns selected value
```

- DatePicker ([components/inputs/DatePicker.tsx]): A pop up date picker that can select a date and return a date object.
```jsx
<DatePicker name="dob" label="Date of Birth" value={state} onChange={(v) => setState(v)} /> //onChange: returns selected date as a date object
```
- Input ([components/inputs/Input.tsx]): A basic text input component. Can be passed a type prop that can specify numbers or email keyboards. 

```jsx
<Input name="name" label="Your Name" value={state} onChange={(v) => setState(v)} /> 
<Input name="age" label="Your Age" value={state} onChange={(v) => setState(v)} type={'number'}/> //onChange: returns the typed value
```

- IconInteract ([components/inputs/IconInteract.tsx]): A touchable opacity that displays an icon.
```jsx
<IconInteract icon={<SomeIcon />} onPress={() => runMyFunction()} />
```