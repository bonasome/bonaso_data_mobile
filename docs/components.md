# BONASO Data Portal Website Components

---

For consistency and maintenance, some components are shared across numerous pages. Below is a brief description of the use case for each of these.

---

# Contents
- [Forms](#forms)
- [Inputs](#inputs)
- [Header](#header)
- [IndexWrapper](#indexwrapper)
- [Loading](#loading)
- [LoadingSpinner](#loadingspinner)
- [StyledScroll](#styledscroll)
- [StyledText](#styledtext)

---

## Forms
This site mostly uses React Hook Forms for collecting information from users. To help ease this process, there are two custom form components:

- [Field](/components/forms/Field.tsx): Takes a variety of inputs (such as label, options, IndexComponent, rules, name, etc.) depending on the type of input (see below) and returns an object the user can interact with. The only component that should reference field is [FormSection](/components/forms/FormSection.tsx), which should be used to build sets of fields. **Note**: A field will accept certain props that depend on the type of input:
    - name (string, required for all)
    - label (string, required for all), what will be displayed to the user
    - rules (object, optional), validation rules (required, email, etc.), passes errors to error prop of input component
    - options (array, MultiCheckbox/Num, RadioButtons, Picker), the option label and value
    - valueField (string, RadioButtons, MultiSelect), key to use for the return value within the option
    - labelField (string, RadioButtons, MultiSelect), key to use for label field

- [FormSection](/components/forms/FormSection.tsx): Combines a variety of forms into one section that can be displayed or hidden based on watches. Can also optionally be given a header. Can be used to conditionally show and hide groups of fields.

For examples of these two components and they are used, see [RespondentForm](/app/authorized/(tabs)/respondents/forms/respondentForm.tsx).
---

## Inputs
Inputs should always be wrapped in our reusable components rather than raw HTML `<input>/<select>` unless explicitly noted.

- [Checkbox](/components/inputs/Checkbox.tsx): A single toggle checkbox with a custom icon that returns a boolean.
```jsx
<Checkbox name="isActive" label="Active?" value={state} onChange={(v) => setState(v)} /> //onChange: boolean (true when checked, false when unchecked)
```

- [MultiCheckbox](/components/inputs/MultiCheckbox.tsx): A list of checkboxes that return information as an array.
```jsx
<MultiCheckbox name="kp_status" label="KP Status" options={[{value: 1, label: 'Option1'}, {value: 2, label: 'Option2'}]} value={state} onChange={(v) => setState(v)} /> //onChange: array of values
```

- [MultiInt](/components/inputs/MultiInt.tsx): A list of numeric inputs that allows a user to enter a set of numbers broken down by a set of options.
```jsx
<MultiInt name="condoms" label="Condoms Received" options={[{value: 1, label: 'Option1'}]} value={state} onChange={(v) => setState(v)} /> 
//when check an input will appear allowing the user to type a number associated with that selected option
//onChange: returns an array of objects [{option: 1, value: 1}]
```

- [RadioButtons](/components/inputs/RadioButtons.tsx): A custom radio button component with custom icons that allows a user to select a single option.
```jsx
<RadioButtons name="sex" label="Sex" options={[{value: 1, label: 'Option1'}, {value: 2, label: 'Option2'}]} value={state} onChange={(v) => setState(v)} /> //onChange: returns selected value
```

- [SimplePicker](/components/inputs/SimplePicker.tsx): A pop up picker that can select a single item. Radio buttons are generally preferred, except for longer lists, where this becomes appropriate. 
```jsx
<SimplePicker name="age_range" label="Age Range" options={[{value: 1, label: 'Option1'}, {value: 2, label: 'Option2'}]} value={state} onChange={(v) => setState(v)} /> //onChange: returns selected value
```

- [DatePicker](/components/inputs/DatePicker.tsx): A pop up date picker that can select a date and return a date object.
```jsx
<DatePicker name="dob" label="Date of Birth" value={state} onChange={(v) => setState(v)} /> //onChange: returns selected date as a date object
```
- [Input](/components/inputs/Input.tsx): A basic text input component. Can be passed a type prop that can specify numbers or email keyboards. 
```jsx
<Input name="name" label="Your Name" value={state} onChange={(v) => setState(v)} /> 
<Input name="age" label="Your Age" value={state} onChange={(v) => setState(v)} type={'number'}/> //onChange: returns the typed value
```

- [IconInteract](/components/inputs/IconInteract.tsx): A touchable opacity that displays an icon.
```jsx
<IconInteract icon={<SomeIcon />} onPress={() => runMyFunction()} />
```
-[StyledButton](/components/inputs/StyledButton.tsx): A touchable opacity that displays text and performs an action. 
```jsx
<StyledButton onPress={() => doSomething()} label='Press Here'>
```

## [Header](/components/header.tsx)
The global header component that displays at the top of the app when the user is signed in. It displays an icon that signals if the user is connected or not. It also contains a button that allows the user to sync the app (gets tasks, gets meta, uploads respondents, and uploads interactions) and a logout button. 

## [IndexWrapper](/components/IndexWrapper.tsx)
Index wrapper for use with paginated components. Allows a user to search records and shift pages. Behavior will differ slightly if the information being passed is from the device DB (custom pagination) or directly from the server (using Django's pagination).
```jsx
<IndexWrapper page={page} onPageChange={setPage} onSearchChange={setSearch} entries={data.count} fromServer={false}>
    data.map((d) => (<Card key={d.id} data={d}>))
</IndexWrapper>
```

## [Loading](/components/Loading.tsx)
Full screen loading component. 
```jsx
if(loading) return <Loading />
```

## [LoadingSpinner](/components/LoadingSpinner.tsx)
A smaller spinner component that can be used to signal a part of screen/singly component is loading without taking up the entire screen. 
```jsx
if(loading) return <LoadingSpinner />
```

## [StyledScroll](/components/styledScroll.tsx)
Styled scroll component that has the correct background/margins. Should be used instead of the default ScrollView. 
```jsx
<StyledScroll>
    <View>
        <Component />
    <View>
</StyledScroll>
```

## [StyledText](/components/styledText.tsx)
Styled text component that has the correct colors and built in types to keep styles consistent. Should be used instead of default Text component. 
```jsx
<StyledText type="default">Wass good bro??</StyledText>
```