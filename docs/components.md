# BONASO Data Portal Website Components

---

For consistency and maintnance, some components are shared across numerous pages. Below is a brief description of the use case for each of these.

---

# Contents
- Forms
- Inputs
- Loading
- IndexViewWrapper
- Filter
- ConfirmDelete
- ReturnLink
- Messages
- Tooltip
- UpdateRecord

---

## Forms
This site mostly uses React Hook Forms for collecting information from users. To help ease this process, there are two custom form components:

- Field ([src/components/reuseables/forms/Field.jsx]): Takes a variety of inputs (such as label, options, IndexComponent, rules, name, etc.) depending on the type of input (see below) and returns an object the user can interact with. The only component that should reference field is FormSection, which should be used to build sets of fields. 

- FormSection ([src/components/reuseables/forms/FormSection.jsx]): Combines a variety of forms into one section that can be displayed or hidden based on watches. Can also optionally be given a header. Meant to be used alongside field.

---

## Inputs
Inputs should always be wrapped in our reusable components rather than raw HTML <input>/<select> unless explicitly noted.

- ButtonHover ([components/inputs/ButtonHover.tsx]): A button (of type button) that displays additional information when hovered (mostly used to show an icon and then additional text when hovered)

- Checkbox ([components/inputs/Checkbox.tsx]): A single toggle checkbox with a custom icon that returns a boolean.

- MultiCheckbox ([components/inputs/MultiCheckbox.tsx]): A list of checkboxes that return information as an array.

- MultiCheckboxNum ([components/inputs/MultiCheckboxNum.tsx]): A list of checkboxes that conditionally show a numeric input if checked. Returns an array of objects with data about the checked item and the number entered. Specifically designed for interactions that need a subcategory and a number, but possibly expandable. 

- RadioButtons ([components/inputs/RadioButtons.tsx]): A custom radio button component with custom icons that allows a user to select a single option.

- SimplePicker ([components/inputs/SimplePicker.tsx]): A pop up picker that can select a single item. Radio buttons are generally preferred, except for longer lists, where this becomes appropriate. 

- Input ([src/components/reuseables/inputs/Input.jsx]): A basic text input component. Can be passed a type prop that can specify for textarea, numbers, email, or date inputs. 

- SimpleDynamicRows ([src/components/reuseables/inputs/SimpleDynamicRows.jsx]): This component is used for creating dynamic lists of text inputs and returns an array. It is really only used for creating Indicator Subcategories (and has custom deprecation logic for that), but could be expanded if similar needs arise in the future. 

- ImageSelect ([src/components/reuseables/inputs/ImageSelect.jsx]): This component displays a list of icons that, when hovered over, also show text. Can be used to select one or multiple items, and will return a single value or array as specified. Used to add a bit of visual flare.

-ModelSelect ([src/components/reuseables/inputs/ModelMultiSelect.jsx]): Allows a user to select another model for foreign key fields.

-ModelMultiSelect ([src/components/reuseables/inputs/ModelMultiSelect.jsx]): Allows a user to select multiple other model instances for m2m or m2one fields. 

**!!Deprecated!!**
- SimpleSelect ([src/components/reuseables/inputs/SimpleSelect.jsx]): This is an overly complicated version of Select that should not be used, but still appears in a few components.

---

## Loading
- Loading ([src/components/reuseables/loading/Loading.jsx]): A full page loading screen. Use for intial page loads or full refreshes. 

- ComponentLoading ([src/components/reuseables/loading/ComponentLoading.jsx]): A smaller loading component that displays moving bars. Use this when a singular component is loading/updating to prevent full page rerenders.

- ButtonLoading ([src/components/reuseables/loading/ButtonLoading.jsx]): A button looking component that shows a spinning wheel. Can be used after a button is clicked to signify that the system is wokring on the request. Used in most forms. 

---

## Flags
The flag system is used for respondents, interactions, social media posts, and event counts (but could be expanded) as a way to note suspiscious entries. The following components help to standardize the process of creating/viewing/resolving flags across different components. 

- FlagCard ([src/components/flags/flagCard.jsx]): Condenses information about a flag into a single expandable card. This is also where flags are resolved.

- FlagDetailModal ([src/components/flags/FlagDetailModal.jsx]): If a page/component does not have space to index a list of flag cards, this modal can be used to display them. 

-FlagModal ([src/components/flags/FlagModal.jsx]): A modal that allows a user to create a new flag. 

## IndexViewWrapper ([src/components/reuseables/IndexView.jsx])
A helper wrapper used for index views that automatically includes a search bar and page buttons. It can also optionally accept a filter component. Passes these back to the main Index Component which manages it using entires, search, page, and optionally filters states.

## Filter ([src/components/reuseables/Filter.jsx])
A helper filter that returns an object which values that an index component can use as url params when making API calls. 

**Note**: Filter requires a filterConfig.js file (usually located in the same folder as the IndexComponent of the app), which has both an array with functions to help build the inputs and an initial value object that sets the initial values for each field. 

## ConfirmDelete ([src/components/reuseables/ConfirmDelete.jsx])
Displays a modal that will appear when a user tries to delete something to ask for confirmation. By default, it will require the user to type "confirm" to enable the delete function. 

## ReturnLink ([src/components/reuseables/ReturnLink.jsx])
The return link displays a small bar at the top of a page with an arrow and a link that is intended to return to the previous page (most commonly used for returning to an index view from a detail view.)

## Messages([src/components/reuseables/Messages.jsx])
This component is designed to display all errors, warnings, and success messages. Can optionally accept a ref for automatic scrolling. Any pages that have any API interactions should include this component.

## Tooltip ([src/components/reuseables/Tooltip.jsx])
This component displays a small info icon that shows helpful text when hovered over (mostly used with RHF forms to explain inputs).

## UpdateRecord ([src/components/reuseables/meta/UpdateRecord.jsx])
The backend will pass created_by/updated_by features for most items, and this component takes created/updated_by/at information and formats it in a consistent way. Should be used for detail views/components so that users can see a record's history. 
